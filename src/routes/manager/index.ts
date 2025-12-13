import { Router } from "express";
import onboarding from "./onboarding";
import picklists from "./picklists";
import scouter from "./scouter";
import teams from "./teams";
import tournaments from "./tournaments";
import matches from "./matches";
import scoutershift from "./scoutershift";
import users from "./users";
import settings from "./settings";
import dashboard from "./dashboard";
import scoutingLead from "./scoutingLead";
import csv from "./csv";

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
