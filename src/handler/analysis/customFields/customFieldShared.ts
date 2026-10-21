import { CustomField, CustomFieldType, User } from "@prisma/client";
import z from "zod";
import prismaClient from "../../../prismaClient.js";
import { dataSourceRuleSchema, DataSourceRule } from "../dataSourceRule.js";

// Metric key convention for custom fields, used everywhere a metric path is
// accepted (categories, details, breakdowns, picklist weights): cf_<fieldUuid>
export const CF_PREFIX = "cf_";

export const cfKey = (fieldUuid: string): string => `${CF_PREFIX}${fieldUuid}`;

/** Returns the field uuid if the key is a cf_ metric key, otherwise null */
export const parseCfKey = (key: string): string | null => {
  if (typeof key !== "string" || !key.startsWith(CF_PREFIX)) return null;
  const uuid = key.slice(CF_PREFIX.length);
  return uuid.length > 0 ? uuid : null;
};

/**
 * Custom data is only ever computed from reports submitted by the viewer's own
 * team. If the viewer's team source rule excludes their own team (or they have
 * no team), every custom surface must be empty.
 */
export const teamSourceRuleAllowsOwnTeam = (user: User): boolean => {
  if (user?.teamNumber === null || user?.teamNumber === undefined) return false;
  const parsed = dataSourceRuleSchema(z.number()).safeParse(
    user.teamSourceRule,
  );
  if (!parsed.success) return false;
  if (parsed.data.mode === "INCLUDE") {
    return parsed.data.items.includes(user.teamNumber);
  }
  return !parsed.data.items.includes(user.teamNumber);
};

/**
 * Active (non-archived) custom fields for a team, optionally filtered by type,
 * in canonical display order.
 */
export const getActiveCustomFields = async (
  teamNumber: number,
  types?: CustomFieldType[],
): Promise<CustomField[]> => {
  return prismaClient.customField.findMany({
    where: {
      teamNumber: teamNumber,
      archived: false,
      ...(types ? { type: { in: types } } : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }, { uuid: "asc" }],
  });
};

// Shape of a custom field answer as exposed on raw-report responses
// (reconciliation #6)
export type CustomFieldAnswerView = {
  uuid: string;
  fieldUuid: string;
  name: string;
  type: CustomFieldType;
  options: string[];
  order: number;
  archived: boolean;
  textValue: string | null;
  numberValue: number | null;
  selections: string[];
};

/**
 * All stored answers for one scout report (archived fields included, flagged),
 * sorted by the field's canonical order. Only answered fields are returned.
 */
export const getAnswersForReport = async (
  scoutReportUuid: string,
): Promise<CustomFieldAnswerView[]> => {
  const answers = await prismaClient.customFieldAnswer.findMany({
    where: { scoutReportUuid: scoutReportUuid },
    include: { field: true },
  });

  answers.sort((a, b) => {
    if (a.field.order !== b.field.order) return a.field.order - b.field.order;
    const timeDiff =
      a.field.createdAt.getTime() - b.field.createdAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.field.uuid < b.field.uuid ? -1 : a.field.uuid > b.field.uuid ? 1 : 0;
  });

  return answers.map((answer) => ({
    uuid: answer.uuid,
    fieldUuid: answer.fieldUuid,
    name: answer.field.name,
    type: answer.field.type,
    options: answer.field.options,
    order: answer.field.order,
    archived: answer.field.archived,
    textValue: answer.textValue,
    numberValue: answer.numberValue,
    selections: answer.selections,
  }));
};

/**
 * CSV output is generated with quoting disabled, so free-form values must not
 * contain commas or newlines.
 */
export const sanitizeCsv = (value: string): string => {
  return value
    .replace(/,/g, ";")
    .replace(/\r\n/g, " ")
    .replace(/[\r\n]/g, " ");
};

/**
 * Builds a uuid -> label map for CSV columns, de-duplicating repeated field
 * names with " 2"/" 3" suffixes (first occurrence keeps the bare name).
 * Fields should be passed in canonical display order.
 */
export const buildCustomColumnLabels = (
  fields: { uuid: string; name: string }[],
): Record<string, string> => {
  const labels: Record<string, string> = {};
  const seenCounts: Record<string, number> = {};
  for (const field of fields) {
    const count = (seenCounts[field.name] ?? 0) + 1;
    seenCounts[field.name] = count;
    labels[field.uuid] = count === 1 ? field.name : `${field.name} ${count}`;
  }
  return labels;
};

/** Formats one answer for a CSV cell; blank when unanswered */
export const formatAnswerForCsv = (
  field: { type: CustomFieldType },
  answer?: {
    textValue: string | null;
    numberValue: number | null;
    selections: string[];
  } | null,
): string => {
  if (!answer) return "";
  switch (field.type) {
    case CustomFieldType.TEXT:
      return answer.textValue !== null && answer.textValue !== undefined
        ? sanitizeCsv(answer.textValue)
        : "";
    case CustomFieldType.NUMBER:
      return answer.numberValue !== null && answer.numberValue !== undefined
        ? String(answer.numberValue)
        : "";
    case CustomFieldType.SINGLE_SELECT:
    case CustomFieldType.MULTI_SELECT:
      return answer.selections.map(sanitizeCsv).join("|");
    default:
      return "";
  }
};

/**
 * INCLUDE/EXCLUDE tournament source rule as a positional-parameter SQL
 * condition, matching how existing raw-SQL analysis functions apply it
 * (e.g. nonEventMetric): INCLUDE -> `col = ANY($n)`, EXCLUDE -> `col != ALL($n)`.
 * The rule's items array must be bound at position `paramIndex`.
 */
export const tournamentRuleToSqlCondition = (
  rule: DataSourceRule<string>,
  col: string,
  paramIndex: number,
): { clause: string; param: string[] } => {
  return {
    clause:
      rule.mode === "INCLUDE"
        ? `${col} = ANY($${paramIndex}::text[])`
        : `${col} != ALL($${paramIndex}::text[])`,
    param: rule.items,
  };
};

/** Parses the viewer's tournament source rule (same as existing raw-SQL users) */
export const getTournamentSourceRule = (user: User): DataSourceRule<string> => {
  const parsed = dataSourceRuleSchema(z.string()).safeParse(
    user?.tournamentSourceRule,
  );
  return parsed.success ? parsed.data : { mode: "INCLUDE", items: [] };
};
