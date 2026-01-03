import { Router } from "express";
import { requireAuth } from "@/src/lib/middleware/requireAuth.js";
import { addApiKey } from "@/src/handler/manager/apikey/addApiKey.js";
import { getApiKeys } from "@/src/handler/manager/apikey/getApiKeys.js";
import { renameApiKey } from "@/src/handler/manager/apikey/renameApiKey.js";
import { revokeApiKey } from "@/src/handler/manager/apikey/revokeApiKey.js";

const router = Router();

router.use(requireAuth);

router.post("/", requireAuth, addApiKey);
router.delete("/", requireAuth, revokeApiKey);
router.get("/", requireAuth, getApiKeys);
router.patch("/", requireAuth, renameApiKey);

export default router;
