import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { getReportCSV } from "../../handler/analysis/csv/getReportCSV.js";
import { getTeamCSV } from "../../handler/analysis/csv/getTeamCSV.js";

const router = Router();

router.use(requireAuth);

router.get("/csvplain", getTeamCSV);
router.get("/reportcsv", getReportCSV);

export default router;
