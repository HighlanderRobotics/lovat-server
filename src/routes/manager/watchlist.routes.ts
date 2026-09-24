import { Router } from "express";
import { requireAuth } from "../../lib/middleware/requireAuth.js";
import { requireVerifiedTeam } from "../../lib/middleware/requireVerifiedTeam.js";
import { addWatchlistEntry } from "../../handler/manager/watchlist/addWatchlistEntry.js";
import { getWatchlistEntry } from "../../handler/manager/watchlist/getWatchlistEntries.js";
import { deleteWatchlistEntry } from "../../handler/manager/watchlist/deleteWatchlistEntry.js";

const router = Router();

//router.use(requireAuth, requireVerifiedTeam);

router.post("/", addWatchlistEntry);
router.get("/", getWatchlistEntry);
router.delete("/", deleteWatchlistEntry);

export default router;
