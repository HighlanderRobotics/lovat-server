import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { updateScouterShift } from "../../handler/manager/scoutershifts/updateScouterShift";
import { deleteScouterShift } from "../../handler/manager/scoutershifts/deleteScouterShift";

const router = Router();

router.use(requireAuth);

router.post("/:uuid", updateScouterShift);

router.delete("/:uuid", deleteScouterShift);

export default router;
