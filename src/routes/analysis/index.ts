import { Router } from "express";
import alliance from "./alliance";
import csv from "./csv";
import matchPrediction from "./matchPrediction";
import picklist from "./picklist";
import pitScouting from "./pitScouting";
import specificReport from "./specificReport";
import teamLookup from "./teamLookup";

const router = Router();

router.use("/", teamLookup);
router.use("/", alliance);
router.use("/", matchPrediction);
router.use("/", picklist);
router.use("/", pitScouting);
router.use("/", csv);
router.use("/", specificReport);

export default router;
