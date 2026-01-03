import { Router } from "express";

import slackRoutes from "@/src/routes/slack/slack.routes.js";
import managerRoutes from "@/src/routes/manager/manager.routes.js";
import analysisRoutes from "@/src/routes/analysis/analysis.routes.js";
import { onboardingRedirect } from "@/src/handler/slack/onboardingRedirect.js";

const router = Router();

router.use("/slack", slackRoutes);
router.use("/manager", managerRoutes);
router.use("/analysis", analysisRoutes);

router.get("/invite", onboardingRedirect);

export default router;
