import { Router } from "express";
import { githubLogin, githubCallback, logoutAndDelete } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/github/login", githubLogin);
router.get("/github/callback", githubCallback);
router.delete("/logout", authMiddleware, logoutAndDelete);

export default router;
