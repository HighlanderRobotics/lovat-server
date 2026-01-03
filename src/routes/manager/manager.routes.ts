import { Router } from "express";

import onboarding from "./onboarding.routes.js";
import picklists from "./picklists.routes.js";
import mutablepicklist from "./mutablepicklists.routes.js";
import registeredteams from "./registeredteams.routes.js";
import scouters from "./scouters.routes.js";
import tournaments from "./tournaments.routes.js";
import scoutreports from "./scoutreports.routes.js";
import settings from "./settings.routes.js";
//import apikey from "./apikey.routes.js";

import { getTournaments } from "../../handler/manager/getTournaments.js";
import { getTeams } from "../../handler/manager/getTeams.js";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { getMatches } from "../../handler/manager/getMatches.js";
import { updateNotes } from "../../handler/manager/updateNotes.js";
import { getScouters } from "../../handler/manager/getScouters.js";
import { getProfile } from "../../handler/manager/getProfile.js";
import { getUsers } from "../../handler/manager/getUsers.js";
import { deleteUser } from "../../handler/manager/deleteUser.js";
import { updateRoleToScoutingLead } from "../../handler/manager/updateRoleToScoutingLead.js";
import { getAnalysts } from "../../handler/manager/getAnalysts.js";
import { addNotOnTeam } from "../../handler/manager/temp/addNotOnTeam.js";
import { getTeamCode } from "../../handler/manager/getTeamCode.js";
import { addScoutReportDashboard } from "../../handler/manager/addScoutReportDashboard.js";
import { getTeamTournamentStatus } from "../../handler/manager/getTeamTournamentStatus.js";
import { getMatchResults } from "../../handler/manager/getMatchResults.js";

const router = Router();

router.use("/onboarding", onboarding);
router.use("/picklists", picklists);
router.use("/mutablepicklists", mutablepicklist);
router.use("/registeredteams", registeredteams);
router.use("/", scouters);
router.use("/tournament", tournaments);
router.use("/scoutreports", scoutreports);
router.use("/settings", settings);
//router.use("/apikey", apikey);

router.use(requireAuth);

router.get("/teams", getTeams);
router.get("/tournaments", getTournaments);

router.get("/matches/:tournament", getMatches);

router.put("/notes/:uuid", updateNotes);

router.get("/scoutershift/scouters", getScouters);

router.get("/profile", getProfile);

router.get("/users", getUsers);

router.delete("/user", deleteUser);

router.post("/upgradeuser", updateRoleToScoutingLead);

router.get("/analysts", getAnalysts);

router.post("/noteam", addNotOnTeam);

router.get("/code", getTeamCode);

router.post("/dashboard/scoutreport", addScoutReportDashboard);

router.get("/v1/manager/team-tournament-status", getTeamTournamentStatus);

router.get("/v1/manager/match-results-page", getMatchResults);

export default router;
