import express from "express";
import "dotenv/config";
import bodyParser from "body-parser";

import { requireAuth } from "./lib/middleware/requireAuth.js";

import { addMutablePicklist } from "./handler/manager/addMutablePicklist.js";

import { addPicklist } from "./handler/manager/addPicklist.js";
import { addRegisteredTeam } from "./handler/manager/addRegisteredTeam.js";
import { addScouterShift } from "./handler/manager/addScouterShift.js";
import { approveRegisteredTeam } from "./handler/manager/approveRegisteredTeam.js";
import { checkRegisteredTeam } from "./handler/manager/checkRegisteredTeam.js";
import { deleteScoutReport } from "./handler/manager/deleteScoutReport.js";
import { deleteMutablePicklist } from "./handler/manager/deleteMutablePicklist.js";
import { deletePicklist } from "./handler/manager/deletePicklist.js";
import { deleteScouterShift } from "./handler/manager/deleteScouterShift.js";
import { getMutablePicklists } from "./handler/manager/getMutablePicklists.js";
import { getPicklists } from "./handler/manager/getPicklists.js";
import { getScouterSchedule } from "./handler/manager/getScouterSchedule.js";
import { getTeamsInTournament } from "./handler/manager/getTeamsInTournament.js";
import { rejectRegisteredTeam } from "./handler/manager/rejectRegisteredTeam.js";
import { getTournaments } from "./handler/manager/getTournaments.js";
import { addUsername } from "./handler/manager/addUsername.js";
import { getTeams } from "./handler/manager/getTeams.js";
import { updateScouterShift } from "./handler/manager/updateScouterShift.js";
import scheduleJobs from "./lib/scheduleJobs.js";
import { checkCode } from "./handler/manager/checkCode.js";
import { addTournamentSource } from "./handler/manager/addTournamentSource.js";
import { addTeamSource } from "./handler/manager/addTeamSource.js";
import { addScoutReport } from "./handler/manager/addScoutReport.js";
import { getScoutReport } from "./handler/manager/getScoutReport.js";
import { getMatches } from "./handler/manager/getMatchesNew.js";
import { getSinglePicklist } from "./handler/manager/getSinglePicklist.js";
import { getSingleMutablePicklist } from "./handler/manager/getSingleMutablePicklist.js";
import { updatePicklist } from "./handler/manager/updatePicklist.js";
import { updateMutablePicklist } from "./handler/manager/updateMutablePicklist.js";
import { addWebsite } from "./handler/manager/addWebsite.js";
import requireLovatSignature from "./lib/middleware/requireLovatSignature.js";
import { approveTeamEmail } from "./handler/manager/approveTeamEmail.js";
import rateLimit from "express-rate-limit";
import { resendEmail } from "./handler/manager/resendEmail.js";
import { getProfile } from "./handler/manager/getProfile.js";
import { deleteUser } from "./handler/manager/deleteUser.js";
import { getUsers } from "./handler/manager/getUsers.js";
import { updateRoleToScoutingLead } from "./handler/manager/updateRoleToScoutingLead.js";
import { detailsPage } from "./handler/analysis/teamLookUp/detailsPage.js";
import { categoryMetrics } from "./handler/analysis/teamLookUp/categoryMetrics.js";
import { breakdownMetrics } from "./handler/analysis/teamLookUp/breakdownMetrics.js";
import { checkCodeScouter } from "./handler/manager/checkCodeScouter.js";
import { changeNameScouter } from "./handler/manager/changeNameScouter.js";
import { getScoutersOnTeam } from "./handler/manager/getScoutersOnTeam.js";
import { getScheduleForScouter } from "./handler/manager/getScheduleForScouter.js";
import { addNewScouter } from "./handler/manager/addNewScouter.js";
import { updateNotes } from "./handler/manager/updateNotes.js";
import { getTeamCode } from "./handler/manager/getTeamCode.js";
import { getAnalysts } from "./handler/manager/getAnalysts.js";
import { updateSettings } from "./handler/manager/updateSettings.js";
import { getNotes } from "./handler/analysis/teamLookUp/getNotes.js";
import { alliancePageResponse } from "./handler/analysis/alliancePredictions/alliancePageResponse.js";
import { matchPrediction } from "./handler/analysis/alliancePredictions/matchPrediction.js";
import { getTeamSource } from "./handler/manager/getTeamSource.js";
import { getTournamentSource } from "./handler/manager/getTournamentSource.js";
import { picklistShell } from "./handler/analysis/picklist/picklistShell.js";
// import { scoutingLeadPage } from "./handler/analysis/scoutingLead/scoutingLeadPage.js";
import { getScouterTournaments } from "./handler/manager/getScouterTournaments.js";
import { getScouters } from "./handler/manager/getScouters.js";
import { addScoutReportDashboard } from "./handler/manager/addScoutReportDashboard.js";
import { matchPageSpecificScouter } from "./handler/analysis/specificMatchPage/matchPageSpecificScouter.js";
import { scoutReportForMatch } from "./handler/analysis/specificMatchPage/scoutReportForMatch.js";
import { timelineForScoutReport } from "./handler/analysis/specificMatchPage/timelineForScoutReport.js";
import { getTournamentForScouterWithSchedule } from "./handler/manager/getTournamentForScouterWithSchedule.js";
import { multipleFlags } from "./handler/analysis/teamLookUp/multipleFlags.js";
import { updateTeamEmail } from "./handler/manager/updateTeamEmail.js";
import { addNotOnTeam } from "./handler/manager/addNotOnTeam.js";
import { updateScouterName } from "./handler/manager/updateScouterName.js";
import { deleteScouter } from "./handler/manager/deleteScouter.js";
import { scoutingLeadProgressPage } from "./handler/manager/scoutingLeadProgressPage.js";
import { addScouterDashboard } from "./handler/manager/addScouterDashboard.js";
import { scouterScoutReports } from "./handler/analysis/scoutingLead/scouterScoutReports.js";
import { pitDisplay } from "./handler/manager/pitDisplay.js";
import { getTeamCSV } from "./handler/manager/getTeamCSV.js";
import { getTeamMatchCSV } from "./handler/manager/getTeamMatchCSV.js";
import { getReportCSV } from "./handler/manager/getReportCSV.js";
import { emailTeamCode } from "./handler/manager/emailTeamCode.js";
import { breakdownDetails } from "./handler/analysis/teamLookUp/breakdownDetails.js";
import { getTeamRankings } from "./handler/manager/getTeamRankings.js";
import { getTeamTournamentStatus } from "./handler/manager/getTeamTournamentStatus.js";
import { getMatchResults } from "./handler/manager/getMatchResults.js";
import { addSlackWorkspace } from "./handler/slack/addSlackWorkspace.js";
import { processCommand } from "./handler/slack/processCommands.js";
import { processEvent } from "./handler/slack/processEvents.js";
import { setupExpressErrorHandler } from "posthog-node";
import { posthog } from "./posthogClient.js";
import posthogReporter from "./lib/middleware/posthogMiddleware.js";
import { requireSlackToken } from "./lib/middleware/requireSlackToken.js";
import { migrateDataSources } from "./lib/migrateDataSources.js";
import { archiveScouter } from "./handler/manager/archiveScouter.js";
import { unarchiveScouter } from "./handler/manager/unarchiveScouter.js";
import { onboardingRedirect } from "./handler/slack/onboardingRedirect.js";
import cookieParser from "cookie-parser";
import { clearCache } from "./lib/clearCache.js";
// import { addTournamentMatchesOneTime } from "./handler/manager/addTournamentMatchesOneTime.js";

const resendEmailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 2,
  message:
    "Too many emails sent from this IP, please try again after 2 minutes",
  validate: { trustProxy: false },
});

const updateTeamEmails = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  message:
    "Too many email updates sent from this IP, please try again after 2 minutes",
  validate: { trustProxy: false },
});

const app = express();

setupExpressErrorHandler(posthog, app);

app.set("trust proxy", true);

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(cookieParser());

app.get("/v1/slack-invite", onboardingRedirect);

// add/update slack workspace
app.get("/v1/slack/add-workspace", requireSlackToken, addSlackWorkspace);

// process slash commands
app.post(
  "/v1/slack/command",
  express.urlencoded({ extended: true }),
  requireSlackToken,
  processCommand
);

app.post("/v1/slack/event", requireSlackToken, processEvent);

app.post(
  "/v1/manager/onboarding/verifyemail",
  requireLovatSignature,
  approveTeamEmail
); //tested

// Log requests
app.use(posthogReporter);

//general endpoints
app.get(
  "/v1/manager/tournament/:tournament/teams",
  requireAuth,
  getTeamsInTournament
);
app.get(
  "/v1/manager/tournament/:tournament/rankedTeams",
  requireAuth,
  getTeamRankings
);
app.get("/v1/manager/teams", requireAuth, getTeams); //tested
app.get("/v1/manager/tournaments", requireAuth, getTournaments); //tested

//match schedule page
app.get("/v1/manager/matches/:tournament", requireAuth, getMatches); // should be able to filter by tournament, team, and whether or not they have been scouted.
// app.get('/API/isScouted') //what will be sent, and what should it return // We can hold off on this until it's time for the collection app

//scout report
app.delete("/v1/manager/scoutreports/:uuid", requireAuth, deleteScoutReport); // tested
app.put("/v1/manager/notes/:uuid", requireAuth, updateNotes);
app.get("/v1/manager/scoutreports/:uuid", getScoutReport); //tested

//scouter shift
app.post(
  "/v1/manager/tournament/:tournament/scoutershifts",
  requireAuth,
  addScouterShift
); //tested , expecting only 1 at a time
// app.get('/manager/tournament/:tournament/scoutershifts',requireAuth, getScouterSchedule) //tested
app.post("/v1/manager/scoutershifts/:uuid", requireAuth, updateScouterShift); //tested
app.delete("/v1/manager/scoutershifts/:uuid", requireAuth, deleteScouterShift); //tested
app.get("/v1/manager/scoutershift/scouters", requireAuth, getScouters);

//picklist (waiting to fully finish testing when I have a second user to play with)
app.post("/v1/manager/picklists", requireAuth, addPicklist); //tested
app.get("/v1/manager/picklists", requireAuth, getPicklists); //tested
app.delete("/v1/manager/picklists/:uuid", requireAuth, deletePicklist); //tested
app.get("/v1/manager/picklists/:uuid", requireAuth, getSinglePicklist); //tested
app.put("/v1/manager/picklists/:uuid", requireAuth, updatePicklist); //tested

//mutable picklist (waiting to fully finish testing when I have a second user to play with)
app.post("/v1/manager/mutablepicklists", requireAuth, addMutablePicklist); // tested
app.delete(
  "/v1/manager/mutablepicklists/:uuid",
  requireAuth,
  deleteMutablePicklist
); //tested
app.get("/v1/manager/mutablepicklists", requireAuth, getMutablePicklists); //tested
app.get(
  "/v1/manager/mutablepicklists/:uuid",
  requireAuth,
  getSingleMutablePicklist
); //tested
app.put(
  "/v1/manager/mutablepicklists/:uuid",
  requireAuth,
  updateMutablePicklist
); //tested

// Also it would be nice to have an endpoint to subscribe to a mutable picklist, so that the client can get updates when it changes
// Websocket time? lol, ill add to wish list items, after this break yes

//onboarding endpoints
app.get(
  "/v1/manager/registeredteams/:team/registrationstatus",
  requireAuth,
  checkRegisteredTeam
); //tested
app.post("/v1/manager/onboarding/username", requireAuth, addUsername); //tested
app.post("/v1/manager/onboarding/teamcode", requireAuth, checkCode); //tested
app.post("/v1/manager/settings/teamsource", requireAuth, addTeamSource); //tested
app.post(
  "/v1/manager/settings/tournamentsource",
  requireAuth,
  addTournamentSource
);
app.post("/v1/manager/onboarding/team", requireAuth, addRegisteredTeam); //tested, is the link correct?
app.post(
  "/v1/manager/registeredteams/:team/approve",
  requireLovatSignature,
  approveRegisteredTeam
); //tested waiting for new middle ware
app.post(
  "/v1/manager/registeredteams/:team/reject",
  requireLovatSignature,
  rejectRegisteredTeam
); // tested, waiting for new middle ware
app.post("/v1/manager/onboarding/teamwebsite", requireAuth, addWebsite); //tested

app.post(
  "/v1/manager/onboarding/resendverificationemail",
  resendEmailLimiter,
  requireAuth,
  resendEmail
); //tested
app.get("/v1/manager/profile", requireAuth, getProfile); //tested
app.get("/v1/manager/users", requireAuth, getUsers); //tested
app.post("/v1/manager/noteam", requireAuth, addNotOnTeam);

//dashboard app settings
app.delete("/v1/manager/user", requireAuth, deleteUser); //tested, is there more to do with Auth0
app.post("/v1/manager/upgradeuser", requireAuth, updateRoleToScoutingLead); //tested, idk what to name, u can change
app.get("/v1/manager/analysts", requireAuth, getAnalysts); //use for list of people eligable to upgrade ^^^
app.put("/v1/manager/settings", requireAuth, updateSettings);
app.get("/v1/manager/settings/teamsource", requireAuth, getTeamSource);
app.get(
  "/v1/manager/settings/tournamentsource",
  requireAuth,
  getTournamentSource
);
app.put(
  "/v1/manager/settings/teamemail",
  updateTeamEmails,
  requireAuth,
  updateTeamEmail
);

//scouting lead information/QR codes
app.get("/v1/manager/code", requireAuth, getTeamCode);
app.get(
  "/v1/manager/tournament/:tournament/scoutershifts",
  requireAuth,
  getScouterSchedule
); //tested

app.post(
  "/v1/manager/dashboard/scoutreport",
  requireAuth,
  addScoutReportDashboard
);

//scouter onboarding
app.post("/v1/manager/emailTeamCode", emailTeamCode);
app.get("/v1/manager/scouter/checkcode", checkCodeScouter); //tested change name/where request data is coming from/response format as needed
app.post("/v1/manager/unarchive/uuid/:uuid", requireAuth, unarchiveScouter);
app.post("/v1/manager/archive/uuid/:uuid", requireAuth, archiveScouter);
app.post("/v1/manager/name/uuid/:uuid", changeNameScouter); // tested, change name/where request data is coming from/response format as needed
app.get("/v1/manager/scouters", getScoutersOnTeam); //tested
app.post("/v1/manager/scouter", addNewScouter); //tested

//collection app homepage (feel free to change request/response format as needed)
app.get("/v1/manager/scouters/:uuid/tournaments", getScouterTournaments); //tested, gets all tournaments (for settings)
app.get("/v1/manager/scouterschedules/:tournament", getScheduleForScouter); //tested
app.get("/v1/manager/scouter/tournaments", getTournamentForScouterWithSchedule);
app.post("/v1/manager/scoutreports", addScoutReport); //tested

//analysis

//team look up page
app.get("/v1/analysis/metric/:metric/team/:team", requireAuth, detailsPage); //tested, same format
app.get("/v1/analysis/category/team/:team", requireAuth, categoryMetrics); //tested, same format
app.get("/v1/analysis/breakdown/team/:team", requireAuth, breakdownMetrics); //tested, same format
app.get(
  "/v1/analysis/breakdown/team/:team/:breakdown",
  requireAuth,
  breakdownDetails
);
app.get("/v1/analysis/notes/team/:team", requireAuth, getNotes); //tested
app.get("/v1/analysis/flag/team/:team", requireAuth, multipleFlags); //tested

//my alliance page
app.get("/v1/analysis/alliance", requireAuth, alliancePageResponse);

//match prediction
app.get("/v1/analysis/matchprediction", requireAuth, matchPrediction);
app.get("/v1/analysis/picklist", requireAuth, picklistShell);

//scouting lead
app.put("/v1/manager/scoutername", requireAuth, updateScouterName);
app.delete("/v1/manager/scouterdashboard", requireAuth, deleteScouter);
app.get("/v1/manager/scouterspage", requireAuth, scoutingLeadProgressPage);
app.post("/v1/manager/scouterdashboard", requireAuth, addScouterDashboard);
app.get("/v1/manager/scouterreports", requireAuth, scouterScoutReports);

//specific scoutreport

app.get(
  "/v1/analysis/metrics/scoutreport/:uuid",
  requireAuth,
  matchPageSpecificScouter
);
app.get(
  "/v1/analysis/scoutreports/match/:match",
  requireAuth,
  scoutReportForMatch
);
app.get(
  "/v1/analysis/timeline/scoutreport/:uuid",
  requireAuth,
  timelineForScoutReport
);

//pit scouting
app.get("/v1/analysis/pitdisplay", pitDisplay);

// app.get('/v1/addtourny', addTournamentMatchesOneTime)

// csv export
app.get("/v1/analysis/csvplain", requireAuth, getTeamCSV); // tested
app.get("/v1/analysis/matchcsv", requireAuth, getTeamMatchCSV);
app.get("/v1/analysis/reportcsv", requireAuth, getReportCSV);

// current tournament stats widget
app.get(
  "/v1/manager/team-tournament-status",
  requireAuth,
  getTeamTournamentStatus
);

// match results from scouting reports
app.get("/v1/manager/match-results-page", requireAuth, getMatchResults);

// API key management
// app.get("/v1/manager/add-api-key", requireAuth, addApiKey);
// app.get("/v1/manager/revoke-api-key", requireAuth, revokeApiKey);
// app.get("/v1/manager/get-api-keys", requireAuth, getApiKeys);
// app.get("/v1/manager/rename-api-key", requireAuth, renameApiKey);

await scheduleJobs();

await migrateDataSources();

await clearCache();

app.listen(port);
