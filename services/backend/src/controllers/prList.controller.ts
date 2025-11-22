import { Request, Response } from "express";
import { PRModel } from "../models/pr.model.js";

export const listPRs = async (req: Request, res: Response) => {
  try {
    const prs = await PRModel.find().sort({ createdAt: -1 });

    return res.json({ success: true, data: prs });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
