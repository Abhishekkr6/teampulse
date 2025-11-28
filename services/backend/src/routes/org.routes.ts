import { Router } from "express";
import { createOrg } from "../controllers/org.controller";
import { getRepos } from "../controllers/repo.controller";
import { connectRepo } from "../controllers/repoConnect.controller";

const router = Router();

// Org create
router.post("/orgs", createOrg);

// Repo list in org
router.get("/orgs/:orgId/repos", getRepos);

// Connect repo
router.post("/orgs/:orgId/repos/connect", connectRepo);

export default router;
