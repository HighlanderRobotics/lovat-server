import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addApiKey } from "../../handler/manager/apikey/addApiKey.js";
import { getApiKeys } from "../../handler/manager/apikey/getApiKeys.js";
import { renameApiKey } from "../../handler/manager/apikey/renameApiKey.js";
import { revokeApiKey } from "../../handler/manager/apikey/revokeApiKey.js";

const router = Router();

router.use(requireAuth);

router.post("/", addApiKey);
router.delete("/", revokeApiKey);
router.get("/", getApiKeys);
router.patch("/", renameApiKey);

export default router;
