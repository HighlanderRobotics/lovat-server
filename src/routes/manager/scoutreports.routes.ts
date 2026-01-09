import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addScoutReport } from "../../handler/manager/scoutreports/addScoutReport.js";
import { deleteScoutReport } from "../../handler/manager/scoutreports/deleteScoutReport.js";
import { getScoutReport } from "../../handler/manager/scoutreports/getScoutReport.js";

const router = Router();

router.post("/", addScoutReport);

router.use(requireAuth);

router.get("/:uuid", getScoutReport);

router.delete("/:uuid", deleteScoutReport);

export default router;
