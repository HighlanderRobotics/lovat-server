import express from "express"; 
import 'dotenv/config';
import bodyParser from 'body-parser';

import { requireAuth } from "./requireAuth";

import { addMutablePicklist } from "./handler/manager/addMutablePicklist";
import { addAPITeams } from "./handler/manager/addAPITeams";
import { addAPITournaments } from "./handler/manager/addAPITournaments";
import { addPicklist } from "./handler/manager/addPicklist";
import { addRegisteredTeam } from "./handler/manager/addRegisteredTeam";
import { addScouterShift } from "./handler/manager/addScouterShift";
import { approveRegisteredTeam } from "./handler/manager/approveRegisteredTeam";
import { checkRegisteredTeam } from "./handler/manager/checkRegisteredTeam";
import { deleteScoutReport } from "./handler/manager/deleteScoutReport";
import { deleteMutablePicklist } from "./handler/manager/deleteMutablePicklist";
import { deletePicklist } from "./handler/manager/deletePicklist";
import { deleteScouterShift } from "./handler/manager/deleteScouterShift";
import { getMutablePicklists } from "./handler/manager/getMutablePicklist";
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



const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/manager/addMutablePicklist', requireAuth, addMutablePicklist); // Should be POST /manager/mutablepicklists
// app.post('/manager/addAPITeams', requireAuth, addAPITeams); // Not needed
// app.post('/manager/addAPITournaments', requireAuth, addAPITournaments); // Not needed
app.post('/API/manager/picklist', requireAuth, addPicklist) // Should be POST /manager/picklists
app.post('/API/manager/mutablepicklist', requireAuth, addMutablePicklist) // Should be POST /manager/mutablepicklists (duplicated)
app.post('/API/manager/registeredteam', requireAuth,addRegisteredTeam) // Should be POST /manager/registeredteams but this feels like it should be privileged. When is this used?
app.post('/API/manager/tournament/:tournament/scoutershift', requireAuth, addScouterShift) 
app.post('/API/manager/registeredteams/:team/approved', requireAuth, approveRegisteredTeam) 
app.delete('/API/manager/scouterreport/:uuid',requireAuth, deleteScoutReport) 
app.delete('/API/manager/mutablepicklist/:uuid', requireAuth, deleteMutablePicklist) 
app.delete('/API/manager/picklist/:uuid', requireAuth, deletePicklist) 
app.delete('/API/manager/scoutershift/:uuid', requireAuth,deleteScouterShift) 
app.get('/API/manager/mutablepicklists', requireAuth,getMutablePicklists) 
app.get('/API/manager/picklists',requireAuth, getPicklists)
app.get('/API/manager/tournament/:tournament/scoutershifts',requireAuth, getScouterSchedule) 
app.get('/API/manager/tournament/:tournament/teams', requireAuth, getTeamsInTournament) 
app.post('/API/manager/registeredteams/:team/rejected', requireAuth, rejectRegisteredTeam)
app.get('/API/manager/teams', requireAuth, getTeams)
app.post('/API/manager/scoutershift/:uuid', requireAuth,updateScouterShift) 
app.get('/API/manger/tournaments', requireAuth, getTournaments) 
app.post('/API/manager/onboarding/username', requireAuth, addUsername)
app.get('/API/manager/team/:team/registrationstatus', requireAuth, checkRegisteredTeam)
app.get('/API/manager/onboarding/teamcode', requireAuth, )
app.post('/API/manager/settings/tournamentsource')
app.post('/API/manager/settings/teamsource')
app.post('/API/manager/onboarding/teamcode', requireAuth, checkCode)
app.get('/API/tournament', requireAuth, getTournaments) // Should be GET /manager/tournaments
getTBAData();

app.listen(port);
