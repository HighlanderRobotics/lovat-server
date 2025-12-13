import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";

import { addPicklist } from "../../handler/manager/addPicklist";
import { getPicklists } from "../../handler/manager/getPicklists";
import { deletePicklist } from "../../handler/manager/deletePicklist";
import { getSinglePicklist } from "../../handler/manager/getSinglePicklist";
import { updatePicklist } from "../../handler/manager/updatePicklist";

const router = Router();

router.post("/", requireAuth, addPicklist);
router.get("/", requireAuth, getPicklists);
router.get("/:uuid", requireAuth, getSinglePicklist);
router.put("/:uuid", requireAuth, updatePicklist);
router.delete("/:uuid", requireAuth, deletePicklist);

export default router;
