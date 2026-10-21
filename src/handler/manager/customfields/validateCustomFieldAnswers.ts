import z from "zod";
import prismaClient from "../../../prismaClient.js";
import { CustomFieldType } from "@prisma/client";

// Descriptive wire shape for custom field answers on scout report submission
// (reconciliation decision 1): one `value` key for all types —
// TEXT/SINGLE_SELECT -> string, NUMBER -> number, MULTI_SELECT -> string[].
// This schema documents the request body in the OpenAPI spec.
export const CustomFieldAnswersInputSchema = z
  .array(
    z.object({
      fieldUuid: z.string(),
      value: z.union([
        z.string().max(1000),
        z.number(),
        z.array(z.string().max(80)).max(30),
      ]),
    }),
  )
  .max(50);

// Lenient schema used for the ACTUAL request parse. A malformed or oversized
// custom answer must never reject the whole scout report (reconciliation
// decision 4), so at parse time we only cap the array length (abuse guard) and
// accept each entry as-is; validateCustomFieldAnswers below does all per-answer
// validation by dropping/clamping rather than throwing. Using the strict schema
// above here would 400 the entire match report over e.g. a 1001-char text field
// or a 31-option multi-select.
export const CustomFieldAnswersWireSchema = z.array(z.unknown()).max(50);

const MAX_TEXT_LENGTH = 1000;
const MAX_SELECTIONS = 30;

export type ValidatedCustomFieldAnswerRow = {
  fieldUuid: string;
  textValue: string | null;
  numberValue: number | null;
  selections: string[];
};

/**
 * Lenient per-answer validation (reconciliation decision 4): a bad custom
 * answer must never reject a whole scout report. Non-object entries, missing/
 * non-string fieldUuids, unknown/wrong-team uuids, type mismatches, out-of-
 * options selections, duplicate fieldUuids (first occurrence wins), blank text,
 * and empty multi-selects are silently dropped. Over-long text is clamped and
 * multi-selects are de-duplicated/capped. Archived fields are accepted/stored.
 */
export const validateCustomFieldAnswers = async (
  sourceTeamNumber: number,
  answers: unknown[] | undefined,
): Promise<ValidatedCustomFieldAnswerRow[]> => {
  if (!answers || answers.length === 0) {
    return [];
  }

  // Extract a (fieldUuid, value) pair from each loose entry, dropping anything
  // that isn't a well-formed object with a string fieldUuid.
  const parsed: { fieldUuid: string; value: unknown }[] = [];
  for (const raw of answers) {
    if (typeof raw !== "object" || raw === null) continue;
    const fieldUuid = (raw as Record<string, unknown>).fieldUuid;
    if (typeof fieldUuid !== "string") continue;
    parsed.push({ fieldUuid, value: (raw as Record<string, unknown>).value });
  }
  if (parsed.length === 0) return [];

  const fields = await prismaClient.customField.findMany({
    where: {
      uuid: { in: [...new Set(parsed.map((answer) => answer.fieldUuid))] },
      teamNumber: sourceTeamNumber,
    },
  });
  const fieldsByUuid = new Map(fields.map((field) => [field.uuid, field]));

  const rows: ValidatedCustomFieldAnswerRow[] = [];
  const seenFieldUuids = new Set<string>();

  for (const answer of parsed) {
    if (seenFieldUuids.has(answer.fieldUuid)) continue;
    seenFieldUuids.add(answer.fieldUuid);

    const field = fieldsByUuid.get(answer.fieldUuid);
    if (!field) continue;

    switch (field.type) {
      case CustomFieldType.TEXT: {
        if (typeof answer.value !== "string") break;
        const trimmed = answer.value.trim().slice(0, MAX_TEXT_LENGTH);
        if (trimmed.length === 0) break;
        rows.push({
          fieldUuid: field.uuid,
          textValue: trimmed,
          numberValue: null,
          selections: [],
        });
        break;
      }
      case CustomFieldType.NUMBER: {
        if (typeof answer.value !== "number" || !Number.isFinite(answer.value))
          break;
        rows.push({
          fieldUuid: field.uuid,
          textValue: null,
          numberValue: answer.value,
          selections: [],
        });
        break;
      }
      case CustomFieldType.SINGLE_SELECT: {
        if (typeof answer.value !== "string") break;
        if (!field.options.includes(answer.value)) break;
        rows.push({
          fieldUuid: field.uuid,
          textValue: null,
          numberValue: null,
          selections: [answer.value],
        });
        break;
      }
      case CustomFieldType.MULTI_SELECT: {
        if (!Array.isArray(answer.value)) break;
        const selections = [...new Set(answer.value)]
          .filter(
            (option): option is string =>
              typeof option === "string" && field.options.includes(option),
          )
          .slice(0, MAX_SELECTIONS);
        if (selections.length === 0) break;
        rows.push({
          fieldUuid: field.uuid,
          textValue: null,
          numberValue: null,
          selections: selections,
        });
        break;
      }
    }
  }

  return rows;
};
