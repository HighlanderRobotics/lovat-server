import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getTournaments } from "../../handler/manager/getTournaments";
import { getMatches } from "../../handler/manager/getMatchesNew";

const router = Router();

router.get("/", requireAuth, getTournaments);
router.get("/matches/:tournament", requireAuth, getMatches);

export default router;
