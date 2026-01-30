import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { breakdownDetails } from "../../handler/analysis/teamLookUp/breakdownDetails.js";
import { breakdownMetrics } from "../../handler/analysis/teamLookUp/breakdownMetrics.js";
import { categoryMetrics } from "../../handler/analysis/teamLookUp/categoryMetrics.js";
import { detailsPage } from "../../handler/analysis/teamLookUp/detailsPage.js";
import { getNotes } from "../../handler/analysis/teamLookUp/getNotes.js";
import { multipleFlags } from "../../handler/analysis/teamLookUp/multipleFlags.js";

const router = Router();

router.get("/metric/:metric/team/:team", detailsPage);
router.get("/category/team/:team", categoryMetrics);
router.get("/breakdown/team/:team", breakdownMetrics);
router.get("/breakdown/team/:team/:breakdown", breakdownDetails);
router.get("/notes/team/:team", getNotes);
router.get("/flag/team/:team", multipleFlags);

export default router;
