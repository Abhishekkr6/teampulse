import { Router } from "express";
import { githubLogin, githubCallback } from "../controllers/auth.controller";

const router = Router();

router.get("/github/login", githubLogin);
router.get("/github/callback", githubCallback);

export default router;
