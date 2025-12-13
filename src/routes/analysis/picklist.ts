import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { picklistShell } from "../../handler/analysis/picklist/picklistShell";

const router = Router();

router.get("/picklist", requireAuth, picklistShell);

export default router;
