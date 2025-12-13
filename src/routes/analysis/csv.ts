import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { getTeamCSV } from "../../handler/manager/teams/getTeamCSV";
import { getTeamMatchCSV } from "../../handler/manager/teams/getTeamMatchCSV";
import { getReportCSV } from "../../handler/manager/csv/getReportCSV";

const router = Router();

router.get("/csvplain", requireAuth, getTeamCSV);
router.get("/matchcsv", requireAuth, getTeamMatchCSV);
router.get("/reportcsv", requireAuth, getReportCSV);

export default router;
