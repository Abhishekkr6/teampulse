import { Request, Response } from "express";
import { AlertModel } from "../models/alert.model.js";

export const getAlertSummary = async (req: Request, res: Response) => {
  try {
    const alerts = await AlertModel.find({ resolvedAt: null }).sort({
      createdAt: -1,
    });

    return res.json({ success: true, data: alerts });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
