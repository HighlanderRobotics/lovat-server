import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { alliancePageResponse } from "../../handler/analysis/alliancePredictions/alliancePageResponse";

const router = Router();

router.get("/alliance", requireAuth, alliancePageResponse);

export default router;
