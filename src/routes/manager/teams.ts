import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getTeams } from "../../handler/manager/getTeams";
import { getTeamsInTournament } from "../../handler/manager/getTeamsInTournament";
import { getTeamRankings } from "../../handler/manager/getTeamRankings";
import { getTeamTournamentStatus } from "../../handler/manager/getTeamTournamentStatus";

const router = Router();

router.get("/", requireAuth, getTeams);
router.get("/tournament/:tournament/teams", requireAuth, getTeamsInTournament);
router.get("/tournament/:tournament/rankedTeams", requireAuth, getTeamRankings);
router.get("/team-tournament-status", requireAuth, getTeamTournamentStatus);

export default router;
