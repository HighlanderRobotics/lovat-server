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

// Return a Prisma-compatible filter object for scalar fields
export const dataSourceRuleToPrismaFilter = <T extends number | string>(
  rule: DataSourceRule<T>,
): { in?: T[]; notIn?: T[] } | undefined => {
  if (!rule || rule.items.length === 0) return undefined;
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
