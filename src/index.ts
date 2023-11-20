import express from "express"; 
import 'dotenv/config';
import bodyParser from 'body-parser';

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



const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.listen(port);

app.post('/manager/addMutablePicklist', addMutablePicklist);
app.post('/manager/addAPITeams', addAPITeams);
app.post('/manager/addAPITournaments', addAPITournaments);
app.post('/API/manager/addPicklist', addPicklist)
app.post('/API/manager/addMutablePicklist', addMutablePicklist)
app.post('/API/manager/addRegisteredTeam', addRegisteredTeam)
app.post('/API/manager/addScouterShift', addScouterShift)
app.post('/API/manager/approveRegisteredTeam', approveRegisteredTeam)
app.get('/API/manager/checkRegisteredTeam', checkRegisteredTeam)
app.delete('/API/manager/scouterReport/{uuid}', deleteScoutReport)
app.delete('/API/manager/deleteMutablePicklist', deleteMutablePicklist)
app.delete('/API/manager/deletePicklist', deletePicklist)
app.delete('/API/manager/deleteScouterShift', deleteScouterShift)
app.delete('/API/manager/deleteScouterShift', deleteScouterShift)
app.get('/API/manager/getMutablePicklists', getMutablePicklists)
app.get('/API/manager/getPicklists', getPicklists)
app.get('/API/manager/getScouterSchedule', getScouterSchedule)
app.get('/API/manager/tournament/{key}/team', getTeamsInTournament)
app.post('/API/manager/rejectRegisteredTeam', rejectRegisteredTeam)
app.post('/API/manager/updateScouterShift', updateScouterShift)
app.get('/API/tournament', getTournaments)



















