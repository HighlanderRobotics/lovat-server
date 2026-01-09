import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { matchPageSpecificScouter } from "../../handler/analysis/specificMatchPage/matchPageSpecificScouter.js";
import { scoutReportForMatch } from "../../handler/analysis/specificMatchPage/scoutReportForMatch.js";
import { timelineForScoutReport } from "../../handler/analysis/specificMatchPage/timelineForScoutReport.js";

const router = Router();

router.use(requireAuth);

router.get("/metrics/scoutreport/:uuid", matchPageSpecificScouter);
router.get("/scoutreports/match/:match", scoutReportForMatch);
router.get("/timeline/scoutreport/:uuid", timelineForScoutReport);

export default router;