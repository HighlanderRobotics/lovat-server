import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth";
import { addPicklist } from "../../handler/manager/addPicklist";
import { deletePicklist } from "../../handler/manager/deletePicklist";
import { getPicklists } from "../../handler/manager/getPicklists";
import { getSinglePicklist } from "../../handler/manager/getSinglePicklist";
import { updatePicklist } from "../../handler/manager/updatePicklist";

/*

picklists.routes.ts

POST   /manager/picklists
GET    /manager/picklists
GET    /manager/picklists/:uuid
PUT    /manager/picklists/:uuid
DELETE /manager/picklists/:uuid

*/

const router = Router();

router.use(requireAuth);

router.post("/", addPicklist);

router.get("/", getPicklists);

router.get("/:uuid", getSinglePicklist);

router.put("/:uuid", updatePicklist);

router.delete("/:uuid", deletePicklist);

export default router;
