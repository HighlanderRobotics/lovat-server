import { describe, it, expect } from "vitest";
import {
  dataSourceRuleToPrismaFilter,
  dataSourceRuleToArray,
  DataSourceRule,
} from "./dataSourceRule.js";

describe("dataSourceRuleToPrismaFilter", () => {
  it("returns undefined when items is empty (INCLUDE)", () => {
    const rule: DataSourceRule<number> = { mode: "INCLUDE", items: [] };
    expect(dataSourceRuleToPrismaFilter(rule)).toBeUndefined();
  });

  it("returns undefined when items is empty (EXCLUDE)", () => {
    const rule: DataSourceRule<number> = { mode: "EXCLUDE", items: [] };
    expect(dataSourceRuleToPrismaFilter(rule)).toBeUndefined();
  });

  it("returns { in: items } when mode is INCLUDE and items are provided", () => {
    const rule: DataSourceRule<number> = { mode: "INCLUDE", items: [1, 2, 3] };
    expect(dataSourceRuleToPrismaFilter(rule)).toEqual({ in: [1, 2, 3] });
  });

  it("returns { notIn: items } when mode is EXCLUDE and items are provided", () => {
    const rule: DataSourceRule<number> = { mode: "EXCLUDE", items: [4, 5] };
    expect(dataSourceRuleToPrismaFilter(rule)).toEqual({ notIn: [4, 5] });
  });

  it("works with string items (INCLUDE)", () => {
    const rule: DataSourceRule<string> = {
      mode: "INCLUDE",
      items: ["event1", "event2"],
    };
    expect(dataSourceRuleToPrismaFilter(rule)).toEqual({
      in: ["event1", "event2"],
    });
  });

  it("works with string items (EXCLUDE)", () => {
    const rule: DataSourceRule<string> = {
      mode: "EXCLUDE",
      items: ["event3"],
    };
    expect(dataSourceRuleToPrismaFilter(rule)).toEqual({ notIn: ["event3"] });
  });

  it("returns undefined for null/undefined rule", () => {
    expect(dataSourceRuleToPrismaFilter(null as any)).toBeUndefined();
    expect(dataSourceRuleToPrismaFilter(undefined as any)).toBeUndefined();
  });
});

describe("dataSourceRuleToArray", () => {
  const allTeams = [100, 200, 300, 400, 500];

  it("returns only the items in the INCLUDE list", () => {
    const rule: DataSourceRule<number> = {
      mode: "INCLUDE",
      items: [100, 300],
    };
    expect(dataSourceRuleToArray(rule, allTeams)).toEqual([100, 300]);
  });

  it("returns all teams minus excluded items", () => {
    const rule: DataSourceRule<number> = {
      mode: "EXCLUDE",
      items: [100, 300],
    };
    expect(dataSourceRuleToArray(rule, allTeams)).toEqual([200, 400, 500]);
  });

  it("returns empty array when INCLUDE list has no matching items", () => {
    const rule: DataSourceRule<number> = {
      mode: "INCLUDE",
      items: [999],
    };
    expect(dataSourceRuleToArray(rule, allTeams)).toEqual([]);
  });

  it("returns all teams when EXCLUDE list has no matching items", () => {
    const rule: DataSourceRule<number> = {
      mode: "EXCLUDE",
      items: [999],
    };
    expect(dataSourceRuleToArray(rule, allTeams)).toEqual(allTeams);
  });

  it("returns empty array when allTeams is empty (INCLUDE)", () => {
    const rule: DataSourceRule<number> = {
      mode: "INCLUDE",
      items: [100],
    };
    expect(dataSourceRuleToArray(rule, [])).toEqual([]);
  });

  it("returns empty array when allTeams is empty (EXCLUDE)", () => {
    const rule: DataSourceRule<number> = {
      mode: "EXCLUDE",
      items: [100],
    };
    expect(dataSourceRuleToArray(rule, [])).toEqual([]);
  });

  it("works with string items", () => {
    const rule: DataSourceRule<string> = {
      mode: "INCLUDE",
      items: ["2024arc", "2024cars"],
    };
    const all = ["2024arc", "2024cars", "2024cmp"];
    expect(dataSourceRuleToArray(rule, all)).toEqual(["2024arc", "2024cars"]);
  });
});
