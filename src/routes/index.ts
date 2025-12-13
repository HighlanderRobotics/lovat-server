import { Router } from "express";
import manager from "./manager";
import analysis from "./analysis";
import slack from "./slack";

const router = Router();

router.use("/manager", manager);   // /v1/manager/...
router.use("/analysis", analysis); // /v1/analysis/...
router.use("/slack", slack);       // /v1/slack/...

export default router;
