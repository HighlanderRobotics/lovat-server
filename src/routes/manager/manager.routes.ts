import { Router } from "express";

import onboarding from "@/src/routes/manager/onboarding.routes.js";
import picklists from "@/src/routes/manager/picklists.routes.js";
import mutablepicklist from "@/src/routes/manager/mutablepicklists.routes.js";
import registeredteams from "@/src/routes/manager/registeredteams.routes.js";
import scouters from "@/src/routes/manager/scouters.routes.js";
import tournaments from "@/src/routes/manager/tournaments.routes.js";
import scoutreports from "@/src/routes/manager/scoutreports.routes.js";
import settings from "@/src/routes/manager/settings.routes.js";
//import apikey from "@/src/routes/manager/apikey.routes.js";

import { getTournaments } from "@/src/handler/manager/getTournaments.js";
import { getTeams } from "@/src/handler/manager/getTeams.js";
import { requireAuth } from "@/src/lib/middleware/requireAuth.js";
import { getMatches } from "@/src/handler/manager/getMatches.js";
import { updateNotes } from "@/src/handler/manager/updateNotes.js";
import { getScouters } from "@/src/handler/manager/scouters/getScouters.js";
import { getProfile } from "@/src/handler/manager/getProfile.js";
import { getUsers } from "@/src/handler/manager/getUsers.js";
import { deleteUser } from "@/src/handler/manager/deleteUser.js";
import { updateRoleToScoutingLead } from "@/src/handler/manager/scouters/updateRoleToScoutingLead.js";
import { getAnalysts } from "@/src/handler/manager/getAnalysts.js";
import { addNotOnTeam } from "@/src/handler/manager/temp/addNotOnTeam.js";
import { getTeamCode } from "@/src/handler/manager/getTeamCode.js";
import { addScoutReportDashboard } from "@/src/handler/manager/scoutreports/addScoutReportDashboard.js";
import { getTeamTournamentStatus } from "@/src/handler/manager/getTeamTournamentStatus.js";
import { getMatchResults } from "@/src/handler/manager/getMatchResults.js";

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
