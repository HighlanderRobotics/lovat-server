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
import { getCode } from "./handler/manager/getCode";
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
import { detailsPage } from "./handler/analysis/detailsPage";
import { categoryMetrics } from "./handler/analysis/categoryMetrics";
import { breakdownMetrics } from "./handler/analysis/breakdownMetrics";
import { checkCodeScouter } from "./handler/manager/checkCodeScouter";
import { changeNameScouter } from "./handler/manager/changeNameScouter";
import { getScoutersOnTeam } from "./handler/manager/getScoutersOnTeam";
import { getTournamentsWithSchedule } from "./handler/manager/getTournamentWithSchedule";
import { getScheduleForScouter } from "./handler/manager/getScheduleForScouter";
import { addNewScouter } from "./handler/manager/addNewScouter";
import { updateNotes } from "./handler/manager/updateNotes";

const resendEmailLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 2, 
  message: 'Too many emails sent from this IP, please try again after 2 minutes'
});



const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());


//general endpoints
app.get('/manager/tournament/:tournament/teams', requireAuth, getTeamsInTournament) 
app.get('/manager/teams', requireAuth, getTeams) //tested 
app.get('/manager/tournaments', requireAuth, getTournaments) //tested 

//match schedule page
app.get('/manager/matches/:tournament', requireAuth, getMatches) // should be able to filter by tournament, team, and whether or not they have been scouted. 
// app.get('/API/isScouted') //what will be sent, and what should it return // We can hold off on this until it's time for the collection app

//scout report
app.delete('/manager/scoutreports/:uuid',requireAuth, deleteScoutReport) // tested
app.post('/manager/scoutreports',requireAuth, addScoutReport) //tested
app.put('/manager/notes/:uuid', requireAuth, updateNotes) 
app.get('/manager/scoutreports/:uuid', getScoutReport ) //tested


//scouter shift
app.post('/manager/tournament/:tournament/scoutershifts', requireAuth, addScouterShift) //tested , expecting only 1 at a time
app.get('/manager/tournament/:tournament/scoutershifts',requireAuth, getScouterSchedule) //tested 
app.post('/manager/scoutershifts/:uuid', requireAuth,updateScouterShift) //tested 
app.delete('/manager/scoutershifts/:uuid', requireAuth, deleteScouterShift) //tested

//picklist (waiting to fully finish testing when I have a second user to play with)
app.post('/manager/picklists', requireAuth, addPicklist) //tested 
app.get('/manager/picklists',requireAuth, getPicklists) //tested 
app.delete('/manager/picklists/:uuid', requireAuth, deletePicklist) //tested 
app.get('/manager/picklists/:uuid', requireAuth, getSinglePicklist) //tested
app.put('/manager/picklists/:uuid', requireAuth, updatePicklist) //tested




//mutable picklist (waiting to fully finish testing when I have a second user to play with)
app.post('/manager/mutablepicklists', requireAuth, addMutablePicklist) // tested
app.delete('/manager/mutablepicklists/:uuid', requireAuth, deleteMutablePicklist) //tested
app.get('/manager/mutablepicklists', requireAuth,getMutablePicklists) //tested
app.get('/manager/mutablepicklists/:uuid', requireAuth, getSingleMutablePicklist) //tested
app.put('/manager/mutablepicklists/:uuid', requireAuth, updateMutablePicklist) //tested

// Also it would be nice to have an endpoint to subscribe to a mutable picklist, so that the client can get updates when it changes
// Websocket time? lol, ill add to wish list items, after this break yes


//onboarding endpoints
app.get('/manager/registeredteams/:team/registrationstatus', requireAuth, checkRegisteredTeam) //tested
app.post('/manager/onboarding/username', requireAuth,addUsername) //tested
app.post('/manager/onboarding/teamcode',requireAuth,  getCode) //tested
app.post('/manager/settings/teamsource', requireAuth, addTeamSource) //tested
app.post('/manager/settings/tournamentsource', requireAuth, addTournamentSource)
app.post('/manager/onboarding/team', requireAuth,addRegisteredTeam) //tested, is the link correct?
app.post('/manager/registeredteams/:team/approve', requireLovatSignature, approveRegisteredTeam) //tested waiting for new middle ware
app.post('/manager/registeredteams/:team/reject', requireLovatSignature, rejectRegisteredTeam) // tested, waiting for new middle ware
app.post('/manager/onboarding/teamwebsite', requireAuth, addWebsite) //tested
app.post('/manager/onboarding/verifyemail', requireLovatSignature, approveTeamEmail) //tested
app.post('/manager/onboarding/resendverificationemail', resendEmailLimiter, requireAuth, resendEmail) //tested
app.get('/manager/profile', requireAuth, getProfile) //tested
app.get('/manager/users', requireAuth, getUsers) //tested
app.post('/manager/upgradeuser', requireAuth, updateRoleToScoutingLead) //tested, idk what to name, u can change

//dashboard app settings
app.delete('/manager/user', requireAuth, deleteUser) //tested, is there more to do with Auth0



//scouter onboarding
app.get('/manager/scouter/checkcode', checkCodeScouter) //tested change name/where request data is coming from/response format as needed 
app.post('/manager/name/uuid/:uuid', changeNameScouter) // tested, change name/where request data is coming from/response format as needed 
app.get('/manager/scouters/team/:team', getScoutersOnTeam) //tested
app.post('/manager/scouter', addNewScouter) //tested


//collection app homepage (feel free to change request/response format as needed)
app.get('/manager/scouters/tournaments/uuid/:uuid', getTournamentsWithSchedule) //tested
app.get('/manager/scouters/schedules/uuid/:uuid/tournament/:tournament', getScheduleForScouter) //tested


//analysis
app.get('/analysis/metric/:metric/team/:team', requireAuth, detailsPage)
app.get('/analysis/team/:team', requireAuth, categoryMetrics) 
app.get('/analysis/breakdown/team/:team', breakdownMetrics) //change name ??







getTBAData();

app.listen(port);
