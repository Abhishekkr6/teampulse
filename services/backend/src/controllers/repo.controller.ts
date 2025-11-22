import { Request, Response } from "express";
import { RepoModel } from "../models/repo.model.js";

export const getRepos = async (req: Request, res: Response) => {
  try {
    const orgId = req.params.orgId;

    const repos = await RepoModel.find({ orgId });

    return res.json({ success: true, data: repos });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};
