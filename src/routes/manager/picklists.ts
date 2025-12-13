import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";

import { addPicklist } from "../../handler/manager/picklists/addPicklist";
import { getPicklists } from "../../handler/manager/picklists/getPicklists";
import { deletePicklist } from "../../handler/manager/picklists/deletePicklist";
import { getSinglePicklist } from "../../handler/manager/picklists/getSinglePicklist";
import { updatePicklist } from "../../handler/manager/picklists/updatePicklist";

const router = Router();

router.post("/", requireAuth, addPicklist);
router.get("/", requireAuth, getPicklists);
router.get("/:uuid", requireAuth, getSinglePicklist);
router.put("/:uuid", requireAuth, updatePicklist);
router.delete("/:uuid", requireAuth, deletePicklist);

export default router;
