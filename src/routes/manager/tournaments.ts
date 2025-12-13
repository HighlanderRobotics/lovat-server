import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getTournaments } from "../../handler/manager/getTournaments";
import { getMatches } from "../../handler/manager/getMatchesNew";

const router = Router();

// Router: /v1/manager/tournaments
// GET / → list tournaments
router.get("/", requireAuth, getTournaments);
// GET /matches/:tournament → matches for tournament
router.get("/matches/:tournament", requireAuth, getMatches);

export default router;
