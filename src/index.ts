import express from "express"; 
import 'dotenv/config';
import bodyParser from 'body-parser';

import { requireAuth } from "./lib/middleware/requireAuth";

import { addMutablePicklist } from "./handler/manager/addMutablePicklist";

import { addPicklist } from "./handler/manager/addPicklist";
import { addRegisteredTeam } from "./handler/manager/addRegisteredTeam";
import { addScouterShift } from "./handler/manager/addScouterShift";
import { approveRegisteredTeam } from "./handler/manager/approveRegisteredTeam";
import { checkRegisteredTeam } from "./handler/manager/checkRegisteredTeam";
import { deleteScoutReport } from "./handler/manager/deleteScoutReport";
import { deleteMutablePicklist } from "./handler/manager/deleteMutablePicklist";
import { deletePicklist } from "./handler/manager/deletePicklist";
import { deleteScouterShift } from "./handler/manager/deleteScouterShift";
import { getMutablePicklists } from "./handler/manager/getMutablePicklists";
import { getPicklists } from "./handler/manager/getPicklists";
import { getScouterSchedule } from "./handler/manager/getScouterSchedule";
import { getTeamsInTournament } from "./handler/manager/getTeamsInTournament";
import { rejectRegisteredTeam } from "./handler/manager/rejectRegisteredTeam";
import { getTournaments } from "./handler/manager/getTournaments";
import { addUsername } from "./handler/manager/addUsername";
import { getTeams } from "./handler/manager/getTeams";
import {updateScouterShift} from './handler/manager/updateScouterShift'
import getTBAData from "./lib/getTBAData";
import { checkCode } from "./handler/manager/checkCode";
import { addTournamentSource } from "./handler/manager/addTournamentSource";
import { addTeamSource } from "./handler/manager/addTeamSource";
import { addScoutReport } from "./handler/manager/addScoutReport";
import { getScoutReport } from "./handler/manager/getScoutReport";
import { getMatches } from "./handler/manager/getMatches";
import { getSinglePicklist } from "./handler/manager/getSinglePicklist";
import { getSingleMutablePicklist } from "./handler/manager/getSingleMutablePicklist";
import { updatePicklist } from "./handler/manager/updatePicklist";
import { updateMutablePicklist } from "./handler/manager/updateMutablePicklist";
import { addWebsite } from "./handler/manager/addWebsite";
import requireLovatSignature from "./lib/middleware/requireLovatSignature";
import { approveTeamEmail } from "./handler/manager/approveTeamEmail";
import rateLimit from 'express-rate-limit';
import { resendEmail } from "./handler/manager/resendEmail";
import { getProfile } from "./handler/manager/getProfile";
import { deleteUser } from "./handler/manager/deleteUser";
import { getUsers } from "./handler/manager/getUsers";
import { updateRoleToScoutingLead } from "./handler/manager/updateRoleToScoutingLead";
import { detailsPage } from "./handler/analysis/teamLookUp/detailsPage";
import { categoryMetrics } from "./handler/analysis/teamLookUp/categoryMetrics";
import { breakdownMetrics } from "./handler/analysis/teamLookUp/breakdownMetrics";
import { checkCodeScouter } from "./handler/manager/checkCodeScouter";
import { changeNameScouter } from "./handler/manager/changeNameScouter";
import { getScoutersOnTeam } from "./handler/manager/getScoutersOnTeam";
import { getTournamentsWithSchedule } from "./handler/manager/getTournamentWithSchedule";
import { getScheduleForScouter } from "./handler/manager/getScheduleForScouter";
import { addNewScouter } from "./handler/manager/addNewScouter";
import { updateNotes } from "./handler/manager/updateNotes";
import { getTeamCode } from "./handler/manager/getTeamCode";
import { getAnalysts } from "./handler/manager/getAnalysts";
import { updateSettings } from "./handler/manager/updateSettings";
import { getNotes } from "./handler/analysis/teamLookUp/getNotes";
import { alliancePage } from "./handler/analysis/alliancePredictions/alliancePage";
import { alliancePageResponse } from "./handler/analysis/alliancePredictions/alliancePageResponse";
import { matchPrediction } from "./handler/analysis/alliancePredictions/matchPrediction";
import { getTeamSource } from "./handler/manager/getTeamSource";
import { getTournamentSource } from "./handler/manager/getTournamentSource";
import { picklistShell } from "./handler/analysis/picklist/picklistShell";
import { scoutingLeadPage } from "./handler/analysis/scoutingLead/scoutingLeadPage";
import { getScouterTournaments } from "./handler/manager/getScouterTournaments";
import { getScouters } from "./handler/manager/getScouters";
import { addScoutReportDashboard } from "./handler/manager/addScoutReportDashboard";
import { matchPageSpecificScouter } from "./handler/analysis/specificMatchPage/matchPageSpecficScouter";
import { scoutReportForMatch } from "./handler/analysis/specificMatchPage/scoutReportForMatch";
import { timelineForScoutReport } from "./handler/analysis/specificMatchPage/timelineForScoutReport";

const resendEmailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 2, 
  message: 'Too many emails sent from this IP, please try again after 2 minutes'
});



const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());


//general endpoints
app.get('/v1/manager/tournament/:tournament/teams', requireAuth, getTeamsInTournament) 
app.get('/v1/manager/teams', requireAuth, getTeams) //tested 
app.get('/v1/manager/tournaments', requireAuth, getTournaments) //tested 

//match schedule page
app.get('/v1/manager/matches/:tournament', requireAuth, getMatches) // should be able to filter by tournament, team, and whether or not they have been scouted. 
// app.get('/API/isScouted') //what will be sent, and what should it return // We can hold off on this until it's time for the collection app

//scout report
app.delete('/v1/manager/scoutreports/:uuid',requireAuth, deleteScoutReport) // tested
app.put('/v1/manager/notes/:uuid', requireAuth, updateNotes) 
app.get('/v1/manager/scoutreports/:uuid', getScoutReport ) //tested


//scouter shift
app.post('/v1/manager/tournament/:tournament/scoutershifts', requireAuth, addScouterShift) //tested , expecting only 1 at a time
// app.get('/manager/tournament/:tournament/scoutershifts',requireAuth, getScouterSchedule) //tested 
app.post('/v1/manager/scoutershifts/:uuid', requireAuth,updateScouterShift) //tested 
app.delete('/v1/manager/scoutershifts/:uuid', requireAuth, deleteScouterShift) //tested
app.get('/v1/manager/scoutershift/scouters', requireAuth, getScouters)

//picklist (waiting to fully finish testing when I have a second user to play with)
app.post('/v1/manager/picklists', requireAuth, addPicklist) //tested 
app.get('/v1/manager/picklists',requireAuth, getPicklists) //tested 
app.delete('/v1/manager/picklists/:uuid', requireAuth, deletePicklist) //tested 
app.get('/v1/manager/picklists/:uuid', requireAuth, getSinglePicklist) //tested
app.put('/v1/manager/picklists/:uuid', requireAuth, updatePicklist) //tested




//mutable picklist (waiting to fully finish testing when I have a second user to play with)
app.post('/v1/manager/mutablepicklists', requireAuth, addMutablePicklist) // tested
app.delete('/v1/manager/mutablepicklists/:uuid', requireAuth, deleteMutablePicklist) //tested
app.get('/v1/manager/mutablepicklists', requireAuth,getMutablePicklists) //tested
app.get('/v1/manager/mutablepicklists/:uuid', requireAuth, getSingleMutablePicklist) //tested
app.put('/v1/manager/mutablepicklists/:uuid', requireAuth, updateMutablePicklist) //tested

// Also it would be nice to have an endpoint to subscribe to a mutable picklist, so that the client can get updates when it changes
// Websocket time? lol, ill add to wish list items, after this break yes


//onboarding endpoints
app.get('/v1/manager/registeredteams/:team/registrationstatus', requireAuth, checkRegisteredTeam) //tested
app.post('/v1/manager/onboarding/username', requireAuth,addUsername) //tested
app.post('/v1/manager/onboarding/teamcode',requireAuth,  checkCode) //tested
app.post('/v1/manager/settings/teamsource', requireAuth, addTeamSource) //tested
app.post('/v1/manager/settings/tournamentsource', requireAuth, addTournamentSource)
app.post('/v1/manager/onboarding/team', requireAuth,addRegisteredTeam) //tested, is the link correct?
app.post('/v1/manager/registeredteams/:team/approve', requireLovatSignature, approveRegisteredTeam) //tested waiting for new middle ware
app.post('/v1/manager/registeredteams/:team/reject', requireLovatSignature, rejectRegisteredTeam) // tested, waiting for new middle ware
app.post('/v1/manager/onboarding/teamwebsite', requireAuth, addWebsite) //tested
app.post('/v1/manager/onboarding/verifyemail', requireLovatSignature, approveTeamEmail) //tested
app.post('/v1/manager/onboarding/resendverificationemail', resendEmailLimiter, requireAuth, resendEmail) //tested
app.get('/v1/manager/profile', requireAuth, getProfile) //tested
app.get('/v1/manager/users', requireAuth, getUsers) //tested

//dashboard app settings
app.delete('/v1/manager/user', requireAuth, deleteUser) //tested, is there more to do with Auth0
app.post('/v1/manager/upgradeuser', requireAuth, updateRoleToScoutingLead) //tested, idk what to name, u can change
app.get('/v1/manager/analysts', requireAuth, getAnalysts) //use for list of people eligable to upgrade ^^^
app.put('/v1/manager/settings', requireAuth, updateSettings)
app.get('/v1/manager/settings/teamsource', requireAuth, getTeamSource)
app.get('/v1/manager/settings/tournamentsource', requireAuth, getTournamentSource)



//scouting lead information/QR codes
app.get('/v1/manager/code', requireAuth, getTeamCode )
app.get('/v1/manager/tournament/:tournament/scoutershifts',requireAuth, getScouterSchedule) //tested 

app.post('/v1/manager/dashboard/scoutreport', requireAuth, addScoutReportDashboard)




//scouter onboarding
app.get('/v1/manager/scouter/checkcode', checkCodeScouter) //tested change name/where request data is coming from/response format as needed 
app.post('/v1/manager/name/uuid/:uuid', changeNameScouter) // tested, change name/where request data is coming from/response format as needed 
app.get('/v1/manager/scouters', getScoutersOnTeam) //tested
app.post('/v1/manager/scouter', addNewScouter) //tested


//collection app homepage (feel free to change request/response format as needed)
app.get('/v1/manager/scouters/:uuid/tournaments', getScouterTournaments) //tested
app.get('/v1/manager/scouterschedules/:tournament', getScheduleForScouter) //tested

app.post('/v1/manager/scoutreports', addScoutReport) //tested



//analysis


//team look up page
app.get('/v1/analysis/metric/:metric/team/:team', requireAuth, detailsPage) //tested, same format
app.get('/v1/analysis/category/team/:team', requireAuth, categoryMetrics) //tested, same format
app.get('/v1/analysis/breakdown/team/:team', requireAuth, breakdownMetrics) //tested, same format
app.get('/v1/analysis/notes/team/:team', requireAuth, getNotes) //tested

//my alliance page
app.get('/v1/analysis/alliance', requireAuth, alliancePageResponse)

//match prediction
app.get('/v1/analysis/matchprediction', requireAuth, matchPrediction)
app.get('/v1/analysis/picklist', requireAuth, picklistShell)

//scouting lead
app.get('/v1/analysis/scoutinglead', requireAuth, scoutingLeadPage)


//specific match

app.get('/v1/analysis/metrics/scoutreport/:uuid', requireAuth, scoutReportForMatch)
app.get('/v1/analysis/scoutreport/:uuid', requireAuth, matchPageSpecificScouter)
app.get('/v1/analysis/timeline/scoutreport/:uuid', requireAuth, timelineForScoutReport)







getTBAData();

app.listen(port);
