import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addScoutReport } from "../../handler/manager/addScoutReport";
import { deleteScoutReport } from "../../handler/manager/deleteScoutReport";
import { getScoutReport } from "../../handler/manager/getScoutReport";

const router = Router();

router.post("/", addScoutReport);

router.get("/:uuid", getScoutReport);

router.use(requireAuth);

router.delete("/:uuid", deleteScoutReport);

export default router;
