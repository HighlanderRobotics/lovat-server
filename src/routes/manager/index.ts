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

// Manager base router mounted at /v1/manager
// Each subrouter defines relative paths; final route shown per mount
router.use("/onboarding", onboarding); // /v1/manager/onboarding/*
router.use("/picklists", picklists); // /v1/manager/picklists/*
router.use("/scouter", scouter); // /v1/manager/scouter/*
router.use("/teams", teams); // /v1/manager/teams/*
router.use("/tournaments", tournaments); // /v1/manager/tournaments/*
router.use("/matches", matches); // /v1/manager/matches/*
router.use("/scoutershift", scoutershift); // /v1/manager/scoutershift/*
router.use("/", users); // /v1/manager/(profile|users|user|upgradeuser|...)
router.use("/settings", settings); // /v1/manager/settings/*
router.use("/dashboard", dashboard); // /v1/manager/dashboard/*
router.use("/scoutingLead", scoutingLead); // /v1/manager/scoutingLead/*
router.use("/csv", csv); // /v1/manager/csv/*

export default router;
