import z from "zod";

export const dataSourceRuleSchema = <T extends z.ZodString | z.ZodNumber>(
  itemType: T,
) =>
  z.object({
    mode: z.enum(["INCLUDE", "EXCLUDE"]),
    items: z.array(itemType),
  });

export type DataSourceRule<T extends number | string> = {
  mode: "INCLUDE" | "EXCLUDE";
  items: T[];
};

export const dataSourceRuleToPrismaFilter = <T extends number | string>(
  rule: DataSourceRule<T>,
) => {
  return rule.mode === "EXCLUDE" ? { notIn: rule.items } : { in: rule.items };
};

export const dataSourceRuleToArray = <T extends number | string>(
  rule: DataSourceRule<T>,
  allTeams: T[],
): T[] => {
  if (rule.mode === "INCLUDE") {
    return allTeams.filter((team) => rule.items.includes(team));
  } else if (rule.mode === "EXCLUDE") {
    return allTeams.filter((team) => !rule.items.includes(team));
  }
  return [];
};
