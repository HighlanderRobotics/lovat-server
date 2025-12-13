import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addScouterShift } from "../../handler/manager/addScouterShift";
import { deleteScouterShift } from "../../handler/manager/deleteScouterShift";
import { updateScouterShift } from "../../handler/manager/updateScouterShift";

const router = Router();

// GET handled in scouter router (/shift, /shift/scouters)
// POST /v1/manager/scoutershift/scouters
router.post("/scouters", requireAuth, addScouterShift);

// POST /v1/manager/scoutershift/scoutershifts/:uuid
router.post("/scoutershifts/:uuid", requireAuth, updateScouterShift);

// DELETE /v1/manager/scoutershift/scoutershifts/:uuid
router.delete("/scoutershifts/:uuid", requireAuth, deleteScouterShift);

export default router;
