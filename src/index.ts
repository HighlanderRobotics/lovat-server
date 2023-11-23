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
import { updateScouterShift } from "./handler/manager/updateScouterShift";
import { getTournaments } from "./handler/manager/getTournaments";
import getTBAData from "./lib/getTBAData";

const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/manager/addMutablePicklist', requireAuth, addMutablePicklist); // Should be POST /manager/mutablepicklists
// app.post('/manager/addAPITeams', addAPITeams); // Not needed
// app.post('/manager/addAPITournaments', addAPITournaments); // Not needed
// app.post('/API/manager/addPicklist', addPicklist) // Should be POST /manager/picklists
// app.post('/API/manager/addMutablePicklist', addMutablePicklist) // Should be POST /manager/mutablepicklists (duplicated)
// app.post('/API/manager/addRegisteredTeam', addRegisteredTeam) // Should be POST /manager/registeredteams but this feels like it should be privileged. When is this used?
// app.post('/API/manager/addScouterShift', addScouterShift) // Should be POST /manager/tournament/:tournament/scoutershifts
// app.post('/API/manager/approveRegisteredTeam', approveRegisteredTeam) // Should be POST /manager/registeredteams/:team/approved
// app.get('/API/manager/checkRegisteredTeam', checkRegisteredTeam) // Should be GET /manager/registeredteams/:team/approved
// app.delete('/API/manager/scouterReport/{uuid}', deleteScoutReport) // Should be DELETE /manager/scouterreports/:uuid
// app.delete('/API/manager/deleteMutablePicklist', deleteMutablePicklist) // Should be DELETE /manager/mutablepicklists/:id
// app.delete('/API/manager/deletePicklist', deletePicklist) // Should be DELETE /manager/picklists/:id
// app.delete('/API/manager/deleteScouterShift', deleteScouterShift) // Should be DELETE /manager/scoutershifts/:id
// app.delete('/API/manager/deleteScouterShift', deleteScouterShift) // Should be DELETE /manager/scoutershifts/:id (duplicated)
// app.get('/API/manager/getMutablePicklists', getMutablePicklists) // Should be GET /manager/mutablepicklists
// app.get('/API/manager/getPicklists', getPicklists) // Should be GET /manager/picklists
// app.get('/API/manager/getScouterSchedule', getScouterSchedule) // Should be GET /manager/tournament/:tournament/scoutershifts
// app.get('/API/manager/tournament/{key}/team', getTeamsInTournament) // Should be GET /manager/tournament/:tournament/teams
// app.post('/API/manager/rejectRegisteredTeam', rejectRegisteredTeam) // Should be POST /manager/registeredteams/:team/approved
// app.post('/API/manager/updateScouterShift', updateScouterShift) // Should be POST /manager/scoutershifts/:id
app.get('/API/tournament', requireAuth, getTournaments) // Should be GET /manager/tournaments

getTBAData();

app.listen(port);
