import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { detailsPage } from "../../handler/analysis/teamLookUp/detailsPage";
import { categoryMetrics } from "../../handler/analysis/teamLookUp/categoryMetrics";
import { breakdownMetrics } from "../../handler/analysis/teamLookUp/breakdownMetrics";
import { breakdownDetails } from "../../handler/analysis/teamLookUp/breakdownDetails";
import { getNotes } from "../../handler/analysis/teamLookUp/getNotes";
import { multipleFlags } from "../../handler/analysis/teamLookUp/multipleFlags";

const router = Router();

router.get("/metric/:metric/team/:team", requireAuth, detailsPage);
router.get("/category/team/:team", requireAuth, categoryMetrics);
router.get("/breakdown/team/:team", requireAuth, breakdownMetrics);
router.get("/breakdown/team/:team/:breakdown", requireAuth, breakdownDetails);
router.get("/notes/team/:team", requireAuth, getNotes);
router.get("/flag/team/:team", requireAuth, multipleFlags);

export default router;
