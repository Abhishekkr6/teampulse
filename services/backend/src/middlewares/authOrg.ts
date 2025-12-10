import { OrgModel } from "../models/org.model";
import { UserModel } from "../models/user.model";

export const requireOrgAccess = async (req: any, res: any, next: any) => {
  const user = req.user;
  const orgId = req.params.orgId;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = user.id || user._id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const org = await OrgModel.findById(orgId);
  if (!org) return res.status(404).json({ error: "Org not found" });

  // example: creator is owner
  const createdBy = org.get("createdBy");

  if (!createdBy) {
    org.set("createdBy", userId);
    await org.save();
    return next();
  }

  if (String(createdBy) !== String(userId)) {
    // Allow if user is member of org via orgIds
    const userDoc = await UserModel.findById(userId, { orgIds: 1 }).lean();
    const orgIds = Array.isArray(userDoc?.orgIds) ? userDoc!.orgIds.map(String) : [];
    if (!orgIds.includes(String(orgId))) {
      return res.status(403).json({ error: "Not allowed" });
    }
  }

  next();
};
