import { Router } from "express";
import { githubLogin, githubCallback } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/github/login", githubLogin);
router.get("/github/callback", githubCallback);
// Logout route removed per request

export default router;
