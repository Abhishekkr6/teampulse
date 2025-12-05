import { Router } from "express";
import { createOrg } from "../controllers/org.controller";
import { getRepoDetail, getRepos } from "../controllers/repo.controller";
import { connectRepo } from "../controllers/repoConnect.controller";
import { validate } from "../middlewares/validate";
import { createOrgSchema } from "../validators/org.validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireOrgAccess } from "../middlewares/authOrg";

const router = Router();

// Org create
router.post("/orgs", authMiddleware, validate(createOrgSchema), createOrg);

// Repo list in org
router.get("/orgs/:orgId/repos", authMiddleware, requireOrgAccess, getRepos);

// Repo detail
router.get("/orgs/:orgId/repos/:repoId", authMiddleware, requireOrgAccess, getRepoDetail);

// Connect repo
router.post("/orgs/:orgId/repos/connect", authMiddleware, requireOrgAccess, connectRepo);

export default router;
