import express from "express"; 
import 'dotenv/config';
import bodyParser from 'body-parser';

// import { addMutablePicklist } from "./handler/manager/addMutablePicklist";
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
// import { updateScouterShift } from "./handler/manager/updateScouterShift";
import { getTournaments } from "./handler/manager/getTournaments";
//import { filterMatches } from "./handler/manager/filterMatches";




const app = express();

const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// app.post('/manager/mutablepicklists', addMutablePicklist);
app.post('/manager/addAPITeams', addAPITeams); // Not needed
app.post('/manager/addAPITournaments', addAPITournaments); // Not needed
app.post('/API/manager/picklist', addPicklist) // Should be POST /manager/picklists
// app.post('/API/manager/addMutablePicklist', addMutablePicklist) // Should be POST /manager/mutablepicklists (duplicated)
app.post('/API/manager/addRegisteredTeam', addRegisteredTeam) // Should be POST /manager/registeredteams but this feels like it should be privileged. When is this used?
app.post('/API/manager/tournament/:tournament/scoutershift', addScouterShift) 
app.post('/API/manager/registeredteams/:team/approved', approveRegisteredTeam) 
app.get('/API/manager/registeredteams/:team/approved', checkRegisteredTeam) 
app.delete('/API/manager/scouterreport/:uuid', deleteScoutReport) 
app.delete('/API/manager/mutablepicklist/:uuid', deleteMutablePicklist) 
app.delete('/API/manager/picklist/:uuid', deletePicklist) 
app.delete('/API/manager/scoutershift/:uuid', deleteScouterShift) 
app.get('/API/manager/mutablepicklists', getMutablePicklists) 
app.get('/API/manager/picklists', getPicklists)
app.get('/API/manager/tournament/:tournament/scoutershifts', getScouterSchedule) 
app.get('/API/manager/tournament/:tournament/teams', getTeamsInTournament) 
app.post('/API/manager/registeredteams/:team/approved', rejectRegisteredTeam)
// app.post('/API/manager/scoutershift/:uuid', updateScouterShift) 
app.get('/API/manger/tournaments', getTournaments) 

app.listen(port);
