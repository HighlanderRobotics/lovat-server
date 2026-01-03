import { Router } from "express";

import slackRouter from "@/src/routes/slack/slack.routes.js";
import managerRouter from "@/src/routes/manager/manager.routes.js";
import analysisRouter from "@/src/routes/analysis/analysis.routes.js";
import { onboardingRedirect } from "@/src/handler/slack/onboardingRedirect.js";

const router = Router();

router.use("/slack", slackRouter);
router.use("/manager", managerRouter);
router.use("/analysis", analysisRouter);

router.get("/invite", onboardingRedirect);

export default router;
