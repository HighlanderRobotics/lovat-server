import z from "zod";
import prismaClient from "../../../prismaClient.js";
import { CustomFieldType } from "@prisma/client";

// Wire shape for custom field answers on scout report submission
// (reconciliation decision 1): one `value` key for all types —
// TEXT/SINGLE_SELECT -> string, NUMBER -> number, MULTI_SELECT -> string[]
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

export type CustomFieldAnswersInput = z.infer<
  typeof CustomFieldAnswersInputSchema
>;

export type ValidatedCustomFieldAnswerRow = {
  fieldUuid: string;
  textValue: string | null;
  numberValue: number | null;
  selections: string[];
};

/**
 * Lenient per-answer validation (reconciliation decision 4): a bad custom
 * answer must never reject a whole scout report. Unknown/wrong-team uuids,
 * type mismatches, out-of-options selections, duplicate fieldUuids (first
 * occurrence wins), blank text, and empty multi-selects are silently dropped.
 * Archived fields are accepted and stored.
 */
export const validateCustomFieldAnswers = async (
  sourceTeamNumber: number,
  answers: CustomFieldAnswersInput | undefined,
): Promise<ValidatedCustomFieldAnswerRow[]> => {
  if (!answers || answers.length === 0) {
    return [];
  }

  const fields = await prismaClient.customField.findMany({
    where: {
      uuid: { in: [...new Set(answers.map((answer) => answer.fieldUuid))] },
      teamNumber: sourceTeamNumber,
    },
  });
  const fieldsByUuid = new Map(fields.map((field) => [field.uuid, field]));

  const rows: ValidatedCustomFieldAnswerRow[] = [];
  const seenFieldUuids = new Set<string>();

  for (const answer of answers) {
    if (seenFieldUuids.has(answer.fieldUuid)) continue;
    seenFieldUuids.add(answer.fieldUuid);

    const field = fieldsByUuid.get(answer.fieldUuid);
    if (!field) continue;

    switch (field.type) {
      case CustomFieldType.TEXT: {
        if (typeof answer.value !== "string") break;
        const trimmed = answer.value.trim();
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
        const selections = [...new Set(answer.value)].filter((option) =>
          field.options.includes(option),
        );
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
