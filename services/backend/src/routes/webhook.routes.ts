import { Router } from "express";
import { githubWebhookHandler } from "../controllers/webhook.controller";

const router = Router();

router.post("/github", githubWebhookHandler);

export default router;
