import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { getTeamsInTournament } from "../../handler/manager/tournament/getTeamsInTournament.js";
import { getTeamRankings } from "../../handler/manager/tournament/getTeamRankings.js";
import { addScouterShift } from "../../handler/manager/tournament/addScouterShift.js";

/*

tournaments.routes.ts

GET    /manager/tournaments
GET    /manager/tournament/:tournament/teams
GET    /manager/tournament/:tournament/rankedTeams
GET    /manager/tournament/:tournament/scoutershifts

*/

const router = Router();

router.use(requireAuth);

router.get("/:tournament/teams", getTeamsInTournament);

router.get("/:tournament/rankedTeams", getTeamRankings);

router.post("/:tournament/scoutershifts", addScouterShift);

router.get("/:tournament/scoutershifts", getScouterSchedule);

export default router;
