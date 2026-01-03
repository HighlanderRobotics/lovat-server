import { alliancePageResponse } from "@/src/handler/analysis/alliancePredictions/alliancePageResponse";
import { matchPrediction } from "@/src/handler/analysis/alliancePredictions/matchPrediction";
import { getReportCSV } from "@/src/handler/analysis/csv/getReportCSV";
import { getTeamCSV } from "@/src/handler/analysis/csv/getTeamCSV";
import { getTeamMatchCSV } from "@/src/handler/analysis/csv/getTeamMatchCSV";
import { picklistShell } from "@/src/handler/analysis/picklist/picklistShell";
import { matchPageSpecificScouter } from "@/src/handler/analysis/specificMatchPage/matchPageSpecificScouter";
import { scoutReportForMatch } from "@/src/handler/analysis/specificMatchPage/scoutReportForMatch";
import { timelineForScoutReport } from "@/src/handler/analysis/specificMatchPage/timelineForScoutReport";
import { breakdownDetails } from "@/src/handler/analysis/teamLookUp/breakdownDetails";
import { breakdownMetrics } from "@/src/handler/analysis/teamLookUp/breakdownMetrics";
import { categoryMetrics } from "@/src/handler/analysis/teamLookUp/categoryMetrics";
import { detailsPage } from "@/src/handler/analysis/teamLookUp/detailsPage";
import { getNotes } from "@/src/handler/analysis/teamLookUp/getNotes";
import { multipleFlags } from "@/src/handler/analysis/teamLookUp/multipleFlags";
import { pitDisplay } from "@/src/handler/manager/pitDisplay";
import { requireAuth } from "@/src/lib/middleware/requireAuth";
import { Router } from "express";

const router = Router();

router.get("/pitdisplay", pitDisplay);

router.use(requireAuth);

router.get("/metric/:metric/team/:team", detailsPage); //tested, same format
router.get("/category/team/:team", categoryMetrics); //tested, same format
router.get("/breakdown/team/:team", breakdownMetrics); //tested, same format
router.get("/breakdown/team/:team/:breakdown", breakdownDetails);
router.get("/notes/team/:team", getNotes); //tested
router.get("/flag/team/:team", multipleFlags); //tested

router.get("/alliance", alliancePageResponse);

router.get("/matchprediction", matchPrediction);
router.get("/picklist", picklistShell);

router.get("/metrics/scoutreport/:uuid", matchPageSpecificScouter);
router.get("/scoutreports/match/:match", scoutReportForMatch);
router.get("/timeline/scoutreport/:uuid", timelineForScoutReport);

router.get("/csvplain", getTeamCSV);
router.get("/matchcsv", getTeamMatchCSV);
router.get("/reportcsv", getReportCSV);

export default router;
