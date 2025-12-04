import { Router } from "express";
import { getDevelopers } from "../controllers/developer.controller";
import { getDeveloperDetail } from "../controllers/developerDetail.controller";

const router = Router();

router.get("/developers", getDevelopers);
router.get("/developers/:githubId", getDeveloperDetail);

export default router;
