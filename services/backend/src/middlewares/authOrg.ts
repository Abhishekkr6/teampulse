import { OrgModel } from "../models/org.model";

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
    return res.status(403).json({ error: "Not allowed" });
  }

  next();
};
