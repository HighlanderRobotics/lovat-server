import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { requireVerifiedTeam } from "../../lib/middleware/requireVerifiedTeam.js";
import { addWatchlistEntry } from "../../handler/manager/watchlist/addWatchlistEntry.js";

const router = Router();

//router.use(requireAuth, requireVerifiedTeam);

router.post("/", addWatchlistEntry);

export default router;
