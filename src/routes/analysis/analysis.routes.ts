import { alliancePageResponse } from "../../handler/analysis/alliancePredictions/alliancePageResponse.js";
import { matchPrediction } from "../../handler/analysis/alliancePredictions/matchPrediction.js";
import { getReportCSV } from "../../handler/analysis/csv/getReportCSV.js";
import { getTeamCSV } from "../../handler/analysis/csv/getTeamCSV.js";
import { getTeamMatchCSV } from "../../handler/analysis/csv/getTeamMatchCSV.js";
import { picklistShell } from "../../handler/analysis/picklist/picklistShell.js";
import { matchPageSpecificScouter } from "../../handler/analysis/specificMatchPage/matchPageSpecificScouter.js";
import { scoutReportForMatch } from "../../handler/analysis/specificMatchPage/scoutReportForMatch.js";
import { timelineForScoutReport } from "../../handler/analysis/specificMatchPage/timelineForScoutReport.js";
import { breakdownDetails } from "../../handler/analysis/teamLookUp/breakdownDetails.js";
import { breakdownMetrics } from "../../handler/analysis/teamLookUp/breakdownMetrics.js";
import { categoryMetrics } from "../../handler/analysis/teamLookUp/categoryMetrics.js";
import { detailsPage } from "../../handler/analysis/teamLookUp/detailsPage.js";
import { getNotes } from "../../handler/analysis/teamLookUp/getNotes.js";
import { multipleFlags } from "../../handler/analysis/teamLookUp/multipleFlags.js";
import { pitDisplay } from "../../handler/manager/pitDisplay.js";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { Router } from "express";
import teamLookup from "./teamLookup.routes.js"
import csv from "./csv.routes.js"
import scoutReport from "./scoutreport.routes.js"

const router = Router();

router.get("/pitdisplay", pitDisplay);

router.use(requireAuth);

router.use(teamLookup);
router.use(csv);
router.use(scoutReport);

router.get("/alliance", alliancePageResponse);

router.get("/matchprediction", matchPrediction);
router.get("/picklist", picklistShell);

export default router;
