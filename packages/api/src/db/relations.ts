import { relations } from "drizzle-orm/relations";
import {
  scoutReport,
  event,
  scouter,
  teamMatchData,
  registeredTeam,
  user,
  mutablePicklist,
  tournament,
  team,
  scouterScheduleShift,
  sharedPicklist,
  team1,
  team2,
  team3,
  team4,
  team5,
  team6,
} from "./schema";

export const eventRelations = relations(event, ({ one }) => ({
  scoutReport: one(scoutReport, {
    fields: [event.scoutReportUuid],
    references: [scoutReport.uuid],
  }),
}));

export const scoutReportRelations = relations(scoutReport, ({ one, many }) => ({
  events: many(event),
  scouter: one(scouter, {
    fields: [scoutReport.scouterUuid],
    references: [scouter.uuid],
  }),
  teamMatchDatum: one(teamMatchData, {
    fields: [scoutReport.teamMatchKey],
    references: [teamMatchData.key],
  }),
}));

export const scouterRelations = relations(scouter, ({ one, many }) => ({
  scoutReports: many(scoutReport),
  registeredTeam: one(registeredTeam, {
    fields: [scouter.sourceTeamNumber],
    references: [registeredTeam.number],
  }),
  team1s: many(team1),
  team2s: many(team2),
  team3s: many(team3),
  team4s: many(team4),
  team5s: many(team5),
  team6s: many(team6),
}));

export const teamMatchDataRelations = relations(
  teamMatchData,
  ({ one, many }) => ({
    scoutReports: many(scoutReport),
    tournament: one(tournament, {
      fields: [teamMatchData.tournamentKey],
      references: [tournament.key],
    }),
  })
);

export const userRelations = relations(user, ({ one, many }) => ({
  registeredTeam: one(registeredTeam, {
    fields: [user.teamNumber],
    references: [registeredTeam.number],
  }),
  mutablePicklists: many(mutablePicklist),
  sharedPicklists: many(sharedPicklist),
}));

export const registeredTeamRelations = relations(
  registeredTeam,
  ({ one, many }) => ({
    users: many(user),
    team: one(team, {
      fields: [registeredTeam.number],
      references: [team.number],
    }),
    scouters: many(scouter),
    scouterScheduleShifts: many(scouterScheduleShift),
  })
);

export const mutablePicklistRelations = relations(
  mutablePicklist,
  ({ one }) => ({
    user: one(user, {
      fields: [mutablePicklist.authorId],
      references: [user.id],
    }),
    tournament: one(tournament, {
      fields: [mutablePicklist.tournamentKey],
      references: [tournament.key],
    }),
  })
);

export const tournamentRelations = relations(tournament, ({ many }) => ({
  mutablePicklists: many(mutablePicklist),
  teamMatchData: many(teamMatchData),
  scouterScheduleShifts: many(scouterScheduleShift),
}));

export const teamRelations = relations(team, ({ many }) => ({
  registeredTeams: many(registeredTeam),
}));

export const scouterScheduleShiftRelations = relations(
  scouterScheduleShift,
  ({ one, many }) => ({
    registeredTeam: one(registeredTeam, {
      fields: [scouterScheduleShift.sourceTeamNumber],
      references: [registeredTeam.number],
    }),
    tournament: one(tournament, {
      fields: [scouterScheduleShift.tournamentKey],
      references: [tournament.key],
    }),
    team1s: many(team1),
    team2s: many(team2),
    team3s: many(team3),
    team4s: many(team4),
    team5s: many(team5),
    team6s: many(team6),
  })
);

export const sharedPicklistRelations = relations(sharedPicklist, ({ one }) => ({
  user: one(user, {
    fields: [sharedPicklist.authorId],
    references: [user.id],
  }),
}));

export const team1Relations = relations(team1, ({ one }) => ({
  scouter: one(scouter, {
    fields: [team1.a],
    references: [scouter.uuid],
  }),
  scouterScheduleShift: one(scouterScheduleShift, {
    fields: [team1.b],
    references: [scouterScheduleShift.uuid],
  }),
}));

export const team2Relations = relations(team2, ({ one }) => ({
  scouter: one(scouter, {
    fields: [team2.a],
    references: [scouter.uuid],
  }),
  scouterScheduleShift: one(scouterScheduleShift, {
    fields: [team2.b],
    references: [scouterScheduleShift.uuid],
  }),
}));

export const team3Relations = relations(team3, ({ one }) => ({
  scouter: one(scouter, {
    fields: [team3.a],
    references: [scouter.uuid],
  }),
  scouterScheduleShift: one(scouterScheduleShift, {
    fields: [team3.b],
    references: [scouterScheduleShift.uuid],
  }),
}));

export const team4Relations = relations(team4, ({ one }) => ({
  scouter: one(scouter, {
    fields: [team4.a],
    references: [scouter.uuid],
  }),
  scouterScheduleShift: one(scouterScheduleShift, {
    fields: [team4.b],
    references: [scouterScheduleShift.uuid],
  }),
}));

export const team5Relations = relations(team5, ({ one }) => ({
  scouter: one(scouter, {
    fields: [team5.a],
    references: [scouter.uuid],
  }),
  scouterScheduleShift: one(scouterScheduleShift, {
    fields: [team5.b],
    references: [scouterScheduleShift.uuid],
  }),
}));

export const team6Relations = relations(team6, ({ one }) => ({
  scouter: one(scouter, {
    fields: [team6.a],
    references: [scouter.uuid],
  }),
  scouterScheduleShift: one(scouterScheduleShift, {
    fields: [team6.b],
    references: [scouterScheduleShift.uuid],
  }),
}));
