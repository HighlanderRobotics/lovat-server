import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { addMutablePicklist } from "../../handler/manager/mutablepicklists/addMutablePicklist.js";
import { deleteMutablePicklist } from "../../handler/manager/mutablepicklists/deleteMutablePicklist.js";
import { getMutablePicklists } from "../../handler/manager/mutablepicklists/getMutablePicklists.js";
import { getSingleMutablePicklist } from "../../handler/manager/mutablepicklists/getSingleMutablePicklist.js";
import { updateMutablePicklist } from "../../handler/manager/mutablepicklists/updateMutablePicklist.js";

/*

mutablepicklists.routes.ts

POST   /manager/mutablepicklists
GET    /manager/mutablepicklists
GET    /manager/mutablepicklists/:uuid
PUT    /manager/mutablepicklists/:uuid
DELETE /manager/mutablepicklists/:uuid

*/

const router = Router();

router.use(requireAuth);

router.post("/", addMutablePicklist);
router.delete("/:uuid", deleteMutablePicklist);
router.get("/", getMutablePicklists);
router.get("/:uuid", getSingleMutablePicklist);
router.put("/:uuid", updateMutablePicklist);

export default router;
