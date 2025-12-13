import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addScouterShift } from "../../handler/manager/addScouterShift";
import { deleteScouterShift } from "../../handler/manager/deleteScouterShift";
import { updateScouterShift } from "../../handler/manager/updateScouterShift";

const router = Router();

// Router: /v1/manager/scoutershift
// GET handled in scouter router (/shift, /shift/scouters)
// POST /scouters → add scouter shift
router.post("/scouters", requireAuth, addScouterShift);

// POST /scoutershifts/:uuid → update scouter shift
router.post("/scoutershifts/:uuid", requireAuth, updateScouterShift);

// DELETE /scoutershifts/:uuid → delete scouter shift
router.delete("/scoutershifts/:uuid", requireAuth, deleteScouterShift);

export default router;
