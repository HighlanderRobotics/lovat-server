import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { updateScouterShift } from "../../handler/manager/scoutershifts/updateScouterShift.js";
import { deleteScouterShift } from "../../handler/manager/scoutershifts/deleteScouterShift.js";

const router = Router();

router.use(requireAuth);

router.post("/:uuid", updateScouterShift);

router.delete("/:uuid", deleteScouterShift);

export default router;
