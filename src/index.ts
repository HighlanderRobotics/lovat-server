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
import { getMatches } from "./handler/manager/getMatches";



const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());


//general endpoints
app.get('/API/manager/tournament/:tournament/teams', requireAuth, getTeamsInTournament) // Should be /manager/tournament/:tournament/teams
app.get('/API/manager/teams', requireAuth, getTeams) //tested // Should be /manager/teams
app.get('/API/manager/tournaments', requireAuth, getTournaments) //tested // Should be /manager/tournaments

//match schedule page
app.get('/API/manager/matches', requireAuth, getMatches) // this can include filters, what format will they be in? // Should be /manager/matches, should be able to filter by tournament, team, and whether or not they have been scouted. That will be in a different match schedule endpoint, though, so we can include warnings and scheduled scouters
app.get('/API/isScouted') //what will be sent, and what should it return // We can hold off on this until it's time for the collection app

//scout report
app.delete('/API/manager/scouterreport/:uuid',requireAuth, deleteScoutReport) // Should be /manager/scouterreport/:uuid
app.post('/API/manager/scouterreport',requireAuth, addScoutReport) // Should be /manager/scouterreport
app.post('/API/manager/scoutreport/:uuid', requireAuth, ) // Should be /manager/scoutreport/:uuid
app.get('/API/manager/scoutReport', getScoutReport ) // Should be /manager/scoutReport


//scouter shift
app.post('/API/manager/tournament/:tournament/scoutershift', requireAuth, addScouterShift) //tested // Should be /manager/tournament/:tournament/scoutershifts
app.get('/API/manager/tournament/:tournament/scoutershifts',requireAuth, getScouterSchedule) //tested // Should be /manager/tournament/:tournament/scoutershifts
app.post('/API/manager/scoutershift/:uuid', requireAuth,updateScouterShift) //tested // Should be /manager/scoutershifts/:uuid
app.delete('/API/manager/scoutershift/:uuid', requireAuth, deleteScouterShift) //tested // Should be /manager/scoutershifts/:uuid


//picklist (tested)
app.post('/API/manager/picklist', requireAuth, addPicklist) //tested // Should be /manager/picklists
app.get('/API/manager/picklists',requireAuth, getPicklists) //tested // Should be /manager/picklists
app.delete('/API/manager/picklist/:uuid', requireAuth, deletePicklist) //tested // Should be /manager/picklists/:uuid
// We also need an endpoint to get a specific picklist, ideally we wouldn't send every picklist to the client every time they want to see one
// Also, these only respond with the picklists that the user is allowed to see, right?
// I think the uuid should be generated server side if it isn't already
// We also only want people to be able to delete picklists that they created, right?
// I also think that scouting leads should be able to delete any picklist created by someone on their team


//mutable picklist (tested)
app.post('/API/manager/mutablepicklist', requireAuth, addMutablePicklist) // tested
app.delete('/API/manager/mutablepicklist/:uuid', requireAuth, deleteMutablePicklist) //tested
app.get('/API/manager/mutablepicklists', requireAuth,getMutablePicklists) //tested
// Same as above, we need an endpoint to get a specific mutable picklist
// Also it would be nice to have an endpoint to subscribe to a mutable picklist, so that the client can get updates when it changes
// Websocket time?


//onboarding endpoints
app.get('/API/manager/team/:team/registrationstatus', requireAuth, checkRegisteredTeam) //tested, feel free to change the messages being sent back
app.post('/API/manager/onboarding/username', requireAuth,addUsername) //tested
app.post('/API/manager/onboarding/teamcode',requireAuth,  checkCode) //tested, rn just returning true/false for if the password is correctt (when true it adds the team number to the user) // The backend behavior and flow makes sense, but I think the response should be 200 if the code is recognized and 401 if it isn't. I'm also realizing we could get a weird client-server desync if the user enters one team number, then enters the code of a different team. We should include the team number in the request.
app.post('/API/manager/settings/tournamentsource', requireAuth, addTournamentSource) // tested // We should have an settings section in the code to put these since we'll add more and they can be changed
app.post('/API/manager/settings/teamsource', requireAuth, addTeamSource) //tested
app.post('/API/manager/onboarding/team', requireAuth,addRegisteredTeam) //tested
app.post('/API/manager/registeredteam/:team/approved', requireAuth, approveRegisteredTeam) //tested
app.delete('/API/manager/registeredteam/:team/rejected', requireAuth, rejectRegisteredTeam) // tested, is it weird to have one as post, and one as delete? // Yeah, I think it would be better to have both as post. Also neither of these should be requireAuth because they're sent by a different server, not the client. I can make a different middleware for that using hmac.






getTBAData();

app.listen(port);
