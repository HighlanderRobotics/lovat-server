import { Router } from "express";

import slackRouter from "./slack/slack.routes.js";
import managerRouter from "./manager/manager.routes.js";
import analysisRouter from "./analysis/analysis.routes.js";
import { onboardingRedirect } from "../handler/slack/onboardingRedirect.js";

const router = Router();

router.use("/slack", slackRouter);
router.use("/manager", managerRouter);
router.use("/analysis", analysisRouter);

router.get("/invite", onboardingRedirect);

export default router;
