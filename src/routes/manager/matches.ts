import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getMatches } from "../../handler/manager/getMatchesNew";

const router = Router();

// Router: /v1/manager/matches
// GET /:tournament → list matches for tournament
router.get("/:tournament", requireAuth, getMatches);

export default router;
