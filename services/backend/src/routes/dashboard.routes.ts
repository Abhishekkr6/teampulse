import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { getCommitTimeline } from "../controllers/activity.controller.js";
import { getDevelopers } from "../controllers/developer.controller.js";
import { listPRs } from "../controllers/prList.controller.js";
import { getAlertSummary } from "../controllers/alertSummary.controller.js";

const router = Router();

router.get("/orgs/:orgId/dashboard", getDashboardStats);

router.get("/activity/commits", getCommitTimeline);

router.get("/developers", getDevelopers);

router.get("/prs", listPRs);

router.get("/alerts", getAlertSummary);

export default router;
