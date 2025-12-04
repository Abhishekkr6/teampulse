import { Router } from "express";
import { listPRs } from "../controllers/prList.controller";
import { getPRDetail } from "../controllers/prDetail.controller";

const router = Router();

router.get("/prs", listPRs);
router.get("/prs/:id", getPRDetail);

export default router;
