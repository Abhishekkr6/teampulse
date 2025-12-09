import { Request, Response } from "express";
import { OrgModel } from "../models/org.model";
import { UserModel } from "../models/user.model";  // adjust path if needed

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
      return res.status(400).json({
        success: false,
        error: { message: "Name and slug required" },
      });
    }

    // 1) Create Org
    const org = await OrgModel.create({
      name,
      slug,
      createdBy: userId,
    });

    // 2) Update User: defaultOrgId + orgIds
    const user = await UserModel.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: { message: "User not found" } });
    }

    // Add org to user's org list
    const orgId = org._id.toString();

    if (!user.orgIds.includes(orgId)) {
      user.orgIds.push(orgId);
    }

    // Set default org for the user
    user.defaultOrgId = orgId;

    await user.save();

    // 3) Return org + defaultOrgId
    return res.json({
      success: true,
      data: {
        org,
        defaultOrgId: org._id,
      },
    });
  } catch (err) {
    console.error("ORG CREATE ERROR", err);
    return res
      .status(500)
      .json({ success: false, error: { message: "Error creating org" } });
  }
};
