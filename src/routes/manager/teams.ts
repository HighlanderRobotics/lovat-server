import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getTeams } from "../../handler/manager/teams/getTeams";
import { getTeamsInTournament } from "../../handler/manager/teams/getTeamsInTournament";
import { getTeamRankings } from "../../handler/manager/teams/getTeamRankings";
import { getTeamTournamentStatus } from "../../handler/manager/teams/getTeamTournamentStatus";

const router = Router();

router.get("/", requireAuth, getTeams);
router.get("/tournament/:tournament/teams", requireAuth, getTeamsInTournament);
router.get("/tournament/:tournament/rankedTeams", requireAuth, getTeamRankings);
router.get("/team-tournament-status", requireAuth, getTeamTournamentStatus);

export default router;
