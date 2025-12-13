import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { matchPrediction } from "../../handler/analysis/alliancePredictions/matchPrediction";

const router = Router();

router.get("/matchprediction", requireAuth, matchPrediction);

export default router;
