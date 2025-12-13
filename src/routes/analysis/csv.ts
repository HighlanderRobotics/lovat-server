import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getTeamCSV } from "../../handler/manager/getTeamCSV";
import { getTeamMatchCSV } from "../../handler/manager/getTeamMatchCSV";
import { getReportCSV } from "../../handler/manager/getReportCSV";

const router = Router();

router.get("/csvplain", requireAuth, getTeamCSV);
router.get("/matchcsv", requireAuth, getTeamMatchCSV);
router.get("/reportcsv", requireAuth, getReportCSV);

export default router;
