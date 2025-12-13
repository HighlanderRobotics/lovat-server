import { Router } from "express";
import onboarding from "./onboarding.js";
import picklists from "./picklists.js";
import scouter from "./scouter.js";
import teams from "./teams.js";
import tournaments from "./tournaments.js";
import matches from "./matches.js";
import scoutershift from "./scoutershift.js";
import users from "./users.js";
import settings from "./settings.js";
import dashboard from "./dashboard.js";
import scoutingLead from "./scoutingLead.js";
import csv from "./csv.js";

const router = Router();

router.use("/onboarding", onboarding);
router.use("/picklists", picklists);
router.use("/scouter", scouter);
router.use("/teams", teams);
router.use("/tournaments", tournaments);
router.use("/matches", matches);
router.use("/scoutershift", scoutershift);
router.use("/", users);
router.use("/settings", settings);
router.use("/dashboard", dashboard);
router.use("/scoutingLead", scoutingLead);
router.use("/csv", csv);

export default router;
