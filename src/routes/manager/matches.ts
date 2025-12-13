import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getMatches } from "../../handler/manager/getMatchesNew";

const router = Router();

// GET /v1/manager/matches/:tournament
router.get("/:tournament", requireAuth, getMatches);

export default router;
