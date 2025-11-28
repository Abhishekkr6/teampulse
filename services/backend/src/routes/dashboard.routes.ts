import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { getCommitTimeline } from "../controllers/activity.controller";
import { getDevelopers } from "../controllers/developer.controller";
import { listPRs } from "../controllers/prList.controller";
import { getAlertSummary } from "../controllers/alertSummary.controller";

const router = Router();

router.get("/orgs/:orgId/dashboard", getDashboardStats);

router.get("/activity/commits", getCommitTimeline);

router.get("/developers", getDevelopers);

router.get("/prs", listPRs);

router.get("/alerts", getAlertSummary);

export default router;
