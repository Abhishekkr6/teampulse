import { OrgModel } from "../models/org.model";

export const requireOrgAccess = async (req: any, res: any, next: any) => {
  const user = req.user;
  const orgId = req.params.orgId;

  const org = await OrgModel.findById(orgId);
  if (!org) return res.status(404).json({ error: "Org not found" });

  // example: creator is owner
  const createdBy = org.get("createdBy");
  if (!createdBy || String(createdBy) !== String(user._id)) {
    return res.status(403).json({ error: "Not allowed" });
  }

  next();
};
