import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addMutablePicklist } from "../../handler/manager/addMutablePicklist";
import { deleteMutablePicklist } from "../../handler/manager/deleteMutablePicklist";
import { getMutablePicklists } from "../../handler/manager/mutablepicklists/getMutablePicklists";
import { getSingleMutablePicklist } from "../../handler/manager/getSingleMutablePicklist";
import { updateMutablePicklist } from "../../handler/manager/updateMutablePicklist";

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
