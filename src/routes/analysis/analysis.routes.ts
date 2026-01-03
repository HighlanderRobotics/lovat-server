import { Router } from "express";

import onboarding from "./team.routes.js";
import picklists from "./picklists.routes.js";
import alliance from "./alliance.routes.js";
import scoutreport from "./scoutreport.routes.js";
import csv from "./csv.routes.js";

const router = Router();

router.use("/onboarding", onboarding);
router.use("/picklists", picklists);
router.use("/alliance", alliance);
router.use("/csv", csv);
router.use("/scoutreport", scoutreport);

export default router;
