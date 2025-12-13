import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { matchPageSpecificScouter } from "../../handler/analysis/specificMatchPage/matchPageSpecificScouter";
import { scoutReportForMatch } from "../../handler/analysis/specificMatchPage/scoutReportForMatch";
import { timelineForScoutReport } from "../../handler/analysis/specificMatchPage/timelineForScoutReport";

const router = Router();

router.get("/metrics/scoutreport/:uuid", requireAuth, matchPageSpecificScouter);
router.get("/scoutreports/match/:match", requireAuth, scoutReportForMatch);
router.get("/timeline/scoutreport/:uuid", requireAuth, timelineForScoutReport);

export default router;
