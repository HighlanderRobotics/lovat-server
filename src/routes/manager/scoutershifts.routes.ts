import { Router } from "express";
import { requireAuth } from "@/src/lib/middleware/requireAuth.js";
import { updateScouterShift } from "@/src/handler/manager/scoutershifts/updateScouterShift.js";
import { deleteScouterShift } from "@/src/handler/manager/scoutershifts/deleteScouterShift.js";

const router = Router();

router.use(requireAuth);

router.post("/:uuid", updateScouterShift);

router.delete("/:uuid", deleteScouterShift);

export default router;
