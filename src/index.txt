import express from "express";
import "dotenv/config";
import bodyParser from "body-parser";

import { requireAuth } from "./lib/middleware/requireAuth.js";

import { addMutablePicklist } from "./handler/manager/addMutablePicklist.js";

import { addPicklist } from "./handler/manager/addPicklist.js";
import { addRegisteredTeam } from "./handler/manager/addRegisteredTeam.js";
import { addScouterShift } from "./handler/manager/tournament/addScouterShift.js";
import { approveRegisteredTeam } from "./handler/manager/approveRegisteredTeam.js";
import { checkRegisteredTeam } from "./handler/manager/checkRegisteredTeam.js";
import { deleteScoutReport } from "./handler/manager/deleteScoutReport.js";
import { deleteMutablePicklist } from "./handler/manager/deleteMutablePicklist.js";
import { deletePicklist } from "./handler/manager/deletePicklist.js";
import { deleteScouterShift } from "./handler/manager/scoutershifts/deleteScouterShift.js";
import { getMutablePicklists } from "./handler/manager/mutablepicklists/getMutablePicklists.js";
import { getPicklists } from "./handler/manager/getPicklists.js";
import { getScouterSchedule } from "./handler/manager/getScouterSchedule.js";
import { getTeamsInTournament } from "./handler/manager/tournament/getTeamsInTournament.js";
import { rejectRegisteredTeam } from "./handler/manager/rejectRegisteredTeam.js";
import { getTournaments } from "./handler/manager/getTournaments.js";
import { addUsername } from "./handler/manager/onboarding/addUsername.js";
import { getTeams } from "./handler/manager/getTeams.js";
import { updateScouterShift } from "./handler/manager/scoutershifts/updateScouterShift.js";
import scheduleJobs from "./lib/scheduleJobs.js";
import { checkCode } from "./handler/manager/onboarding/checkCode.js";
import { addTournamentSource } from "./handler/manager/addTournamentSource.js";
import { addTeamSource } from "./handler/manager/addTeamSource.js";
import { addScoutReport } from "./handler/manager/addScoutReport.js";
import { getScoutReport } from "./handler/manager/getScoutReport.js";
import { getMatches } from "./handler/manager/getMatches.js";
import { getSinglePicklist } from "./handler/manager/getSinglePicklist.js";
import { getSingleMutablePicklist } from "./handler/manager/getSingleMutablePicklist.js";
import { updatePicklist } from "./handler/manager/updatePicklist.js";
import { updateMutablePicklist } from "./handler/manager/updateMutablePicklist.js";
import { addWebsite } from "./handler/manager/onboarding/addWebsite.js";
import requireLovatSignature from "./lib/middleware/requireLovatSignature.js";
import { approveTeamEmail } from "./handler/manager/onboarding/approveTeamEmail.js";
import rateLimit from "express-rate-limit";
import { resendEmail } from "./handler/manager/resendEmail.js";
import { getProfile } from "./handler/manager/getProfile.js";
import { deleteUser } from "./handler/manager/deleteUser.js";
import { getUsers } from "./handler/manager/getUsers.js";
import { updateRoleToScoutingLead } from "./handler/manager/updateRoleToScoutingLead.js";
import { detailsPage } from "./handler/analysis/teamLookUp/detailsPage.js";
import { categoryMetrics } from "./handler/analysis/teamLookUp/categoryMetrics.js";
import { breakdownMetrics } from "./handler/analysis/teamLookUp/breakdownMetrics.js";
import { checkCodeScouter } from "./handler/manager/scouters/checkCodeScouter.js";
import { changeNameScouter } from "./handler/manager/scouters/changeNameScouter.js";
import { getScoutersOnTeam } from "./handler/manager/scouters/getScoutersOnTeam.js";
import { getScheduleForScouter } from "./handler/manager/scouters/getScheduleForScouter.js";
import { addNewScouter } from "./handler/manager/addNewScouter.js";
import { updateNotes } from "./handler/manager/updateNotes.js";
import { getTeamCode } from "./handler/manager/getTeamCode.js";
import { getAnalysts } from "./handler/manager/getAnalysts.js";
import { updateSettings } from "./handler/manager/updateSettings.js";
import { getNotes } from "./handler/analysis/teamLookUp/getNotes.js";
import { alliancePageResponse } from "./handler/analysis/alliancePredictions/alliancePageResponse.js";
import { matchPrediction } from "./handler/analysis/alliancePredictions/matchPrediction.js";
import { getTeamSource } from "./handler/manager/getTeamSource.js";
import { getTournamentSource } from "./handler/manager/settings/getTournamentSource.js";
import { picklistShell } from "./handler/analysis/picklist/picklistShell.js";
// import { scoutingLeadPage } from "./handler/analysis/scoutingLead/scoutingLeadPage.js";
import { getScouterTournaments } from "./handler/manager/scouters/getScouterTournaments.js";
import { getScouters } from "./handler/manager/getScouters.js";
import { addScoutReportDashboard } from "./handler/manager/addScoutReportDashboard.js";
import { matchPageSpecificScouter } from "./handler/analysis/specificMatchPage/matchPageSpecificScouter.js";
import { scoutReportForMatch } from "./handler/analysis/specificMatchPage/scoutReportForMatch.js";
import { timelineForScoutReport } from "./handler/analysis/specificMatchPage/timelineForScoutReport.js";
import { getTournamentForScouterWithSchedule } from "./handler/manager/scouters/getTournamentForScouterWithSchedule.js";
import { multipleFlags } from "./handler/analysis/teamLookUp/multipleFlags.js";
import { updateTeamEmail } from "./handler/manager/settings/updateTeamEmail.js";
import { addNotOnTeam } from "./handler/manager/temp/addNotOnTeam.js";
import { updateScouterName } from "./handler/manager/scouters/updateScouterName.js";
import { deleteScouter } from "./handler/manager/deleteScouter.js";
import { scoutingLeadProgressPage } from "./handler/manager/scouters/scoutingLeadProgressPage.js";
import { addScouterDashboard } from "./handler/manager/addScouterDashboard.js";
import { scouterScoutReports } from "./handler/analysis/scoutingLead/scouterScoutReports.js";
import { pitDisplay } from "./handler/manager/pitDisplay.js";
import { getTeamCSV } from "./handler/manager/getTeamCSV.js";
import { getTeamMatchCSV } from "./handler/analysis/csv/getTeamMatchCSV.js";
import { getReportCSV } from "./handler/analysis/csv/getReportCSV.js";
import { emailTeamCode } from "./handler/manager/scouters/emailTeamCode.js";
import { breakdownDetails } from "./handler/analysis/teamLookUp/breakdownDetails.js";
import { getTeamRankings } from "./handler/manager/tournament/getTeamRankings.js";
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
import { archiveScouter } from "./handler/manager/scouters/archiveScouter.js";
import { unarchiveScouter } from "./handler/manager/unarchiveScouter.js";
import { onboardingRedirect } from "./handler/slack/onboardingRedirect.js";
import cookieParser from "cookie-parser";
import { clearCache } from "./lib/clearCache.js";
// import { addTournamentMatchesOneTime } from "./handler/manager/addTournamentMatchesOneTime.js";

const app = express();

setupExpressErrorHandler(posthog, app);

app.set("trust proxy", true);

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use(cookieParser());

app.post(
  "/v1/manager/onboarding/verifyemail",
  requireLovatSignature,
  approveTeamEmail,
); //tested

// Log requests
app.use(posthogReporter);

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

//analysis

//team look up page
app.get("/v1/analysis/metric/:metric/team/:team", requireAuth, detailsPage); //tested, same format
app.get("/v1/analysis/category/team/:team", requireAuth, categoryMetrics); //tested, same format
app.get("/v1/analysis/breakdown/team/:team", requireAuth, breakdownMetrics); //tested, same format
app.get(
  "/v1/analysis/breakdown/team/:team/:breakdown",
  requireAuth,
  breakdownDetails,
);
app.get("/v1/analysis/notes/team/:team", requireAuth, getNotes); //tested
app.get("/v1/analysis/flag/team/:team", requireAuth, multipleFlags); //tested

//my alliance page
app.get("/v1/analysis/alliance", requireAuth, alliancePageResponse);

//match prediction
app.get("/v1/analysis/matchprediction", requireAuth, matchPrediction);
app.get("/v1/analysis/picklist", requireAuth, picklistShell);

app.get(
  "/v1/analysis/metrics/scoutreport/:uuid",
  requireAuth,
  matchPageSpecificScouter,
);
app.get(
  "/v1/analysis/scoutreports/match/:match",
  requireAuth,
  scoutReportForMatch,
);
app.get(
  "/v1/analysis/timeline/scoutreport/:uuid",
  requireAuth,
  timelineForScoutReport,
);

//pit scouting
app.get("/v1/analysis/pitdisplay", pitDisplay);

// app.get('/v1/addtourny', addTournamentMatchesOneTime)

// csv export
app.get("/v1/analysis/csvplain", requireAuth, getTeamCSV); // tested
app.get("/v1/analysis/matchcsv", requireAuth, getTeamMatchCSV);
app.get("/v1/analysis/reportcsv", requireAuth, getReportCSV);

await scheduleJobs();

await migrateDataSources();

await clearCache();

app.listen(port);
