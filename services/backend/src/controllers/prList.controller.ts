import { Request, Response } from "express";
import { PRModel } from "../models/pr.model";

export const listPRs = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Number(req.query.pageSize) || 20, 100);

    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      PRModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select("title number state riskScore createdAt repoId")
        .lean(),

      PRModel.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: {
        items,
        page,
        pageSize,
        total,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
