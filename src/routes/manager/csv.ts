import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getMatchResults } from "../../handler/manager/getMatchResults";

const router = Router();

router.get("/match-results-page", requireAuth, getMatchResults);

export default router;
