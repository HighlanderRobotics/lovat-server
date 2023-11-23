import express from "express"; 
import 'dotenv/config';
import bodyParser from 'body-parser';

import { requireAuth } from "./requireAuth";

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
import { addTournamentSource } from "./handler/manager/addTournamentSource";
import { addTeamSource } from "./handler/manager/addTeamSource";
import { addScoutReport } from "./handler/manager/addScoutReport";
import { getScoutReport } from "./handler/manager/getScoutReport";



const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());


//general endpoints
app.get('/API/manager/tournament/:tournament/teams', requireAuth, getTeamsInTournament) 
app.get('/API/manager/teams', requireAuth, getTeams) //tested
app.get('/API/manager/tournaments', requireAuth, getTournaments) //tested

//match schedule page
app.get('/API/manager/matches') // this can include filters, what format will they be in?
app.get('/API/isScouted') //what will be sent, and what should it return

//scout report
app.delete('/API/manager/scouterreport/:uuid',requireAuth, deleteScoutReport) 
app.post('/API/manager/scouterreport',requireAuth, addScoutReport) 
app.post('/API/manager/scoutreport/:uuid', requireAuth, )
app.get('/API/manager/scoutReport', getScoutReport )


//scouter shift
app.post('/API/manager/tournament/:tournament/scoutershift', requireAuth, addScouterShift) //tested
app.get('/API/manager/tournament/:tournament/scoutershifts',requireAuth, getScouterSchedule) //tested
app.post('/API/manager/scoutershift/:uuid', requireAuth,updateScouterShift) //tested
app.delete('/API/manager/scoutershift/:uuid', requireAuth, deleteScouterShift) //tested


//picklist (tested)
app.post('/API/manager/picklist', requireAuth, addPicklist) //tested
app.get('/API/manager/picklists',requireAuth, getPicklists) //tested 
app.delete('/API/manager/picklist/:uuid', requireAuth, deletePicklist) //tested


//mutable picklist (tested)
app.post('/API/manager/mutablepicklist', requireAuth, addMutablePicklist) // tested
app.delete('/API/manager/mutablepicklist/:uuid', requireAuth, deleteMutablePicklist) //tested
app.get('/API/manager/mutablepicklists', requireAuth,getMutablePicklists) //tested


//onboarding endpoints
app.get('/API/manager/team/:team/registrationstatus', requireAuth, checkRegisteredTeam) //tested, feel free to change the messages being sent back
app.post('/API/manager/onboarding/username', requireAuth,addUsername) //tested
app.post('/API/manager/onboarding/teamcode',requireAuth,  checkCode) //tested, rn just returning true/false for if the password is correctt (when true it adds the team number to the user)
app.post('/API/manager/settings/tournamentsource', requireAuth, addTournamentSource) // tested
app.post('/API/manager/settings/teamsource', requireAuth, addTeamSource) //tested
app.post('/API/manager/onboarding/team', requireAuth,addRegisteredTeam) //tested
app.post('/API/manager/registeredteam/:team/approved', requireAuth, approveRegisteredTeam) //tested
app.delete('/API/manager/registeredteam/:team/rejected', requireAuth, rejectRegisteredTeam) // tested, is it weird to have one as post, and one as delete?






getTBAData();

app.listen(port);
