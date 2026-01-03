import { Router } from "express";
import { requireAuth } from "@/src/lib/middleware/requireAuth.js";
import { addScoutReport } from "@/src/handler/manager/scoutreports/addScoutReport.js";
import { deleteScoutReport } from "@/src/handler/manager/scoutreports/deleteScoutReport.js";
import { getScoutReport } from "@/src/handler/manager/scoutreports/getScoutReport.js";

const router = Router();

router.post("/", addScoutReport);

router.get("/:uuid", getScoutReport);

router.use(requireAuth);

router.delete("/:uuid", deleteScoutReport);

export default router;
