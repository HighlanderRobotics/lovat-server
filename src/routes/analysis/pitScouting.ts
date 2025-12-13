import { Router } from "express";
import { pitDisplay } from "../../handler/manager/pitDisplay";

const router = Router();

router.get("/pitdisplay", pitDisplay);

export default router;
