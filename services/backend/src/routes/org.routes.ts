import { Router } from "express";
import { createOrg } from "../controllers/org.controller.js";
import { getRepos } from "../controllers/repo.controller.js";
import { connectRepo } from "../controllers/repoConnect.controller.js";

const router = Router();

// Org create
router.post("/orgs", createOrg);

// Repo list in org
router.get("/orgs/:orgId/repos", getRepos);

// Connect repo
router.post("/orgs/:orgId/repos/connect", connectRepo);

export default router;
