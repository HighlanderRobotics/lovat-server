import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addApiKey } from "../../handler/manager/apikeys/addApiKey";
import { getApiKeys } from "../../handler/manager/apikeys/getApiKeys";
import { renameApiKey } from "../../handler/manager/apikeys/renameApiKey";
import { revokeApiKey } from "../../handler/manager/apikeys/revokeApiKey";

const router = Router();

router.use(requireAuth);

router.post("/", requireAuth, addApiKey);
router.delete("/", requireAuth, revokeApiKey);
router.get("/", requireAuth, getApiKeys);
router.patch("/", requireAuth, renameApiKey);

export default router;
