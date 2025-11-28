import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { UserModel } from "../models/user.model";

const router = Router();

router.get("/me", authMiddleware, async (req: any, res) => {
  const user = await UserModel.findById(req.user.id);

  return res.json({ success: true, data: user });
});

export default router;
