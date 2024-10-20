import {
  pgTable,
  index,
  foreignKey,
  text,
  integer,
  timestamp,
  uniqueIndex,
  boolean,
  smallint,
  doublePrecision,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

export const eventAction = pgEnum("EventAction", [
  "LEAVE",
  "PICK_UP",
  "DROP_RING",
  "SCORE",
  "DEFENSE",
  "FEED_RING",
  "STARTING_POSITION",
]);
export const highNoteResult = pgEnum("HighNoteResult", [
  "NOT_ATTEMPTED",
  "FAILED",
  "SUCCESSFUL",
]);
export const matchType = pgEnum("MatchType", ["QUALIFICATION", "ELIMINATION"]);
export const pickUp = pgEnum("PickUp", ["GROUND", "CHUTE", "BOTH"]);
export const position = pgEnum("Position", [
  "NONE",
  "AMP",
  "SPEAKER",
  "TRAP",
  "WING_NEAR_AMP",
  "WING_FRONT_OF_SPEAKER",
  "WING_CENTER",
  "WING_NEAR_SOURCE",
  "GROUND_NOTE_ALLIANCE_NEAR_AMP",
  "GROUND_NOTE_ALLIANCE_FRONT_OF_SPEAKER",
  "GROUND_NOTE_ALLIANCE_BY_SPEAKER",
  "GROUND_NOTE_CENTER_FARTHEST_AMP_SIDE",
  "GROUND_NOTE_CENTER_TOWARD_AMP_SIDE",
  "GROUND_NOTE_CENTER_CENTER",
  "GROUND_NOTE_CENTER_TOWARD_SOURCE_SIDE",
  "GROUND_NOTE_CENTER_FARTHEST_SOURCE_SIDE",
]);
export const robotRole = pgEnum("RobotRole", [
  "OFFENSE",
  "DEFENSE",
  "FEEDER",
  "IMMOBILE",
]);
export const stageResult = pgEnum("StageResult", [
  "NOTHING",
  "PARK",
  "ONSTAGE",
  "ONSTAGE_HARMONY",
]);
export const userRole = pgEnum("UserRole", ["ANALYST", "SCOUTING_LEAD"]);

export const event = pgTable(
  "Event",
  {
    eventUuid: text().primaryKey().notNull(),
    time: integer().notNull(),
    action: eventAction().notNull(),
    position: position().notNull(),
    points: integer().notNull(),
    scoutReportUuid: text().notNull(),
  },
  (table) => {
    return {
      scoutReportUuidIdx: index("Event_scoutReportUuid_idx").using(
        "btree",
        table.scoutReportUuid.asc().nullsLast()
      ),
      eventScoutReportUuidFkey: foreignKey({
        columns: [table.scoutReportUuid],
        foreignColumns: [scoutReport.uuid],
        name: "Event_scoutReportUuid_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const scoutReport = pgTable(
  "ScoutReport",
  {
    uuid: text().primaryKey().notNull(),
    teamMatchKey: text().notNull(),
    notes: text().notNull(),
    robotRole: robotRole().notNull(),
    driverAbility: integer().notNull(),
    scouterUuid: text().notNull(),
    highNote: highNoteResult().notNull(),
    pickUp: pickUp().notNull(),
    stage: stageResult().notNull(),
    startTime: timestamp({ precision: 3, mode: "string" }).notNull(),
  },
  (table) => {
    return {
      scoutReportScouterUuidFkey: foreignKey({
        columns: [table.scouterUuid],
        foreignColumns: [scouter.uuid],
        name: "ScoutReport_scouterUuid_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      scoutReportTeamMatchKeyFkey: foreignKey({
        columns: [table.teamMatchKey],
        foreignColumns: [teamMatchData.key],
        name: "ScoutReport_teamMatchKey_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const user = pgTable(
  "User",
  {
    id: text().primaryKey().notNull(),
    teamNumber: integer(),
    email: text().notNull(),
    emailVerified: boolean().default(false).notNull(),
    username: text(),
    role: userRole().default("ANALYST").notNull(),
    tournamentSource: text().array(),
    teamSource: integer().array(),
  },
  (table) => {
    return {
      emailKey: uniqueIndex("User_email_key").using(
        "btree",
        table.email.asc().nullsLast()
      ),
      userTeamNumberFkey: foreignKey({
        columns: [table.teamNumber],
        foreignColumns: [registeredTeam.number],
        name: "User_teamNumber_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const mutablePicklist = pgTable(
  "MutablePicklist",
  {
    uuid: text().primaryKey().notNull(),
    teams: integer().array(),
    authorId: text().notNull(),
    name: text().notNull(),
    tournamentKey: text(),
  },
  (table) => {
    return {
      mutablePicklistAuthorIdFkey: foreignKey({
        columns: [table.authorId],
        foreignColumns: [user.id],
        name: "MutablePicklist_authorId_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      mutablePicklistTournamentKeyFkey: foreignKey({
        columns: [table.tournamentKey],
        foreignColumns: [tournament.key],
        name: "MutablePicklist_tournamentKey_fkey",
      })
        .onUpdate("cascade")
        .onDelete("set null"),
    };
  }
);

export const tournament = pgTable("Tournament", {
  key: text().primaryKey().notNull(),
  name: text().notNull(),
  location: text(),
  date: text(),
});

export const team = pgTable("Team", {
  number: integer().primaryKey().notNull(),
  name: text().notNull(),
});

export const registeredTeam = pgTable(
  "RegisteredTeam",
  {
    number: integer().primaryKey().notNull(),
    code: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().default(false).notNull(),
    teamApproved: boolean().default(false).notNull(),
    website: text(),
  },
  (table) => {
    return {
      codeKey: uniqueIndex("RegisteredTeam_code_key").using(
        "btree",
        table.code.asc().nullsLast()
      ),
      registeredTeamNumberFkey: foreignKey({
        columns: [table.number],
        foreignColumns: [team.number],
        name: "RegisteredTeam_number_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const featureToggle = pgTable("FeatureToggle", {
  feature: text().primaryKey().notNull(),
  enabled: boolean().default(true).notNull(),
});

export const scouter = pgTable(
  "Scouter",
  {
    uuid: text().primaryKey().notNull(),
    name: text(),
    sourceTeamNumber: integer().notNull(),
    strikes: integer().default(0).notNull(),
    scouterReliability: integer().default(0).notNull(),
  },
  (table) => {
    return {
      sourceTeamNumberIdx: index("Scouter_sourceTeamNumber_idx").using(
        "btree",
        table.sourceTeamNumber.asc().nullsLast()
      ),
      scouterSourceTeamNumberFkey: foreignKey({
        columns: [table.sourceTeamNumber],
        foreignColumns: [registeredTeam.number],
        name: "Scouter_sourceTeamNumber_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const teamMatchData = pgTable(
  "TeamMatchData",
  {
    key: text().primaryKey().notNull(),
    tournamentKey: text().notNull(),
    matchNumber: smallint().notNull(),
    teamNumber: integer().notNull(),
    matchType: matchType().notNull(),
  },
  (table) => {
    return {
      tournamentKeyTeamNumberIdx: index(
        "TeamMatchData_tournamentKey_teamNumber_idx"
      ).using(
        "btree",
        table.tournamentKey.asc().nullsLast(),
        table.teamNumber.asc().nullsLast()
      ),
      teamMatchDataTournamentKeyFkey: foreignKey({
        columns: [table.tournamentKey],
        foreignColumns: [tournament.key],
        name: "TeamMatchData_tournamentKey_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const scouterScheduleShift = pgTable(
  "ScouterScheduleShift",
  {
    uuid: text().primaryKey().notNull(),
    sourceTeamNumber: integer().notNull(),
    tournamentKey: text().notNull(),
    startMatchOrdinalNumber: integer().notNull(),
    endMatchOrdinalNumber: integer().notNull(),
  },
  (table) => {
    return {
      scouterScheduleShiftSourceTeamNumberFkey: foreignKey({
        columns: [table.sourceTeamNumber],
        foreignColumns: [registeredTeam.number],
        name: "ScouterScheduleShift_sourceTeamNumber_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      scouterScheduleShiftTournamentKeyFkey: foreignKey({
        columns: [table.tournamentKey],
        foreignColumns: [tournament.key],
        name: "ScouterScheduleShift_tournamentKey_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const sharedPicklist = pgTable(
  "SharedPicklist",
  {
    uuid: text().primaryKey().notNull(),
    name: text().notNull(),
    authorId: text().notNull(),
    ampScores: doublePrecision().notNull(),
    autoPoints: doublePrecision().notNull(),
    defense: doublePrecision().notNull(),
    driverAbility: doublePrecision().notNull(),
    feeds: doublePrecision().notNull(),
    pickUps: doublePrecision().notNull(),
    speakerScores: doublePrecision().notNull(),
    stage: doublePrecision().notNull(),
    teleopPoints: doublePrecision().notNull(),
    totalPoints: doublePrecision().notNull(),
    trapScores: doublePrecision().notNull(),
  },
  (table) => {
    return {
      sharedPicklistAuthorIdFkey: foreignKey({
        columns: [table.authorId],
        foreignColumns: [user.id],
        name: "SharedPicklist_authorId_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const team1 = pgTable(
  "_Team1",
  {
    a: text("A").notNull(),
    b: text("B").notNull(),
  },
  (table) => {
    return {
      abUnique: uniqueIndex("_Team1_AB_unique").using(
        "btree",
        table.a.asc().nullsLast(),
        table.b.asc().nullsLast()
      ),
      bIdx: index().using("btree", table.b.asc().nullsLast()),
      team1AFkey: foreignKey({
        columns: [table.a],
        foreignColumns: [scouter.uuid],
        name: "_Team1_A_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      team1BFkey: foreignKey({
        columns: [table.b],
        foreignColumns: [scouterScheduleShift.uuid],
        name: "_Team1_B_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const prismaMigrations = pgTable("_prisma_migrations", {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "string" }),
  migrationName: varchar("migration_name", { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: timestamp("rolled_back_at", {
    withTimezone: true,
    mode: "string",
  }),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const team2 = pgTable(
  "_Team2",
  {
    a: text("A").notNull(),
    b: text("B").notNull(),
  },
  (table) => {
    return {
      abUnique: uniqueIndex("_Team2_AB_unique").using(
        "btree",
        table.a.asc().nullsLast(),
        table.b.asc().nullsLast()
      ),
      bIdx: index().using("btree", table.b.asc().nullsLast()),
      team2AFkey: foreignKey({
        columns: [table.a],
        foreignColumns: [scouter.uuid],
        name: "_Team2_A_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      team2BFkey: foreignKey({
        columns: [table.b],
        foreignColumns: [scouterScheduleShift.uuid],
        name: "_Team2_B_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const team3 = pgTable(
  "_Team3",
  {
    a: text("A").notNull(),
    b: text("B").notNull(),
  },
  (table) => {
    return {
      abUnique: uniqueIndex("_Team3_AB_unique").using(
        "btree",
        table.a.asc().nullsLast(),
        table.b.asc().nullsLast()
      ),
      bIdx: index().using("btree", table.b.asc().nullsLast()),
      team3AFkey: foreignKey({
        columns: [table.a],
        foreignColumns: [scouter.uuid],
        name: "_Team3_A_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      team3BFkey: foreignKey({
        columns: [table.b],
        foreignColumns: [scouterScheduleShift.uuid],
        name: "_Team3_B_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const team4 = pgTable(
  "_Team4",
  {
    a: text("A").notNull(),
    b: text("B").notNull(),
  },
  (table) => {
    return {
      abUnique: uniqueIndex("_Team4_AB_unique").using(
        "btree",
        table.a.asc().nullsLast(),
        table.b.asc().nullsLast()
      ),
      bIdx: index().using("btree", table.b.asc().nullsLast()),
      team4AFkey: foreignKey({
        columns: [table.a],
        foreignColumns: [scouter.uuid],
        name: "_Team4_A_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      team4BFkey: foreignKey({
        columns: [table.b],
        foreignColumns: [scouterScheduleShift.uuid],
        name: "_Team4_B_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const team5 = pgTable(
  "_Team5",
  {
    a: text("A").notNull(),
    b: text("B").notNull(),
  },
  (table) => {
    return {
      abUnique: uniqueIndex("_Team5_AB_unique").using(
        "btree",
        table.a.asc().nullsLast(),
        table.b.asc().nullsLast()
      ),
      bIdx: index().using("btree", table.b.asc().nullsLast()),
      team5AFkey: foreignKey({
        columns: [table.a],
        foreignColumns: [scouter.uuid],
        name: "_Team5_A_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      team5BFkey: foreignKey({
        columns: [table.b],
        foreignColumns: [scouterScheduleShift.uuid],
        name: "_Team5_B_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);

export const team6 = pgTable(
  "_Team6",
  {
    a: text("A").notNull(),
    b: text("B").notNull(),
  },
  (table) => {
    return {
      abUnique: uniqueIndex("_Team6_AB_unique").using(
        "btree",
        table.a.asc().nullsLast(),
        table.b.asc().nullsLast()
      ),
      bIdx: index().using("btree", table.b.asc().nullsLast()),
      team6AFkey: foreignKey({
        columns: [table.a],
        foreignColumns: [scouter.uuid],
        name: "_Team6_A_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
      team6BFkey: foreignKey({
        columns: [table.b],
        foreignColumns: [scouterScheduleShift.uuid],
        name: "_Team6_B_fkey",
      })
        .onUpdate("cascade")
        .onDelete("cascade"),
    };
  }
);
