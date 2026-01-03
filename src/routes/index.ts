import { Router } from "express";

import slackRoutes from "./slack/slack.routes.js";
import managerRoutes from "./manager/manager.routes.js";
import analysisRoutes from "./analysis/analysis.routes.js";
import { onboardingRedirect } from "../handler/slack/onboardingRedirect.js";

const router = Router();

router.use("/slack", slackRoutes);
router.use("/manager", managerRoutes);
router.use("/analysis", analysisRoutes);

router.get("/invite", onboardingRedirect);

export default router;
