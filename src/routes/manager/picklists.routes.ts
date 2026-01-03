import { Router } from "express";
import { requireAuth } from "@/src/lib/middleware/requireAuth.js";
import { addPicklist } from "@/src/handler/manager/picklists/addPicklist.js";
import { deletePicklist } from "@/src/handler/manager/picklists/deletePicklist.js";
import { getPicklists } from "@/src/handler/manager/picklists/getPicklists.js";
import { getSinglePicklist } from "@/src/handler/manager/picklists/getSinglePicklist.js";
import { updatePicklist } from "@/src/handler/manager/picklists/updatePicklist.js";

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
