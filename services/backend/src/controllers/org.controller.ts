import { Request, Response } from "express";
import { OrgModel } from "../models/org.model";

export const createOrg = async (req: any, res: Response) => {
  try {
    const { name, slug } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: { message: "Unauthorized" } });
    }

    if (!name || !slug) {
      return res
        .status(400)
        .json({ success: false, error: { message: "Name and slug required" } });
    }

    const org = await OrgModel.create({
      name,
      slug,
      settings: {},
      createdBy: userId,
    });

    return res.json({ success: true, data: org });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: "Error creating org" } });
  }
};
