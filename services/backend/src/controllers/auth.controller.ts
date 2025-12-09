import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  exchangeCodeForToken,
  getGithubUser,
  getGithubEmail,
} from "../services/github.service";
import { UserModel } from "../models/user.model";
import { OrgModel } from "../models/org.model"; // adjust path
import { createToken } from "../services/jwt.service";
import logger from "../utils/logger";
import { RepoModel } from "../models/repo.model";
import { CommitModel } from "../models/commit.model";
import { PRModel } from "../models/pr.model";
import { AlertModel } from "../models/alert.model";

export const githubLogin = async (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirect = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
  return res.redirect(redirect);
};

export const githubCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;

    const accessToken = await exchangeCodeForToken(code);
    const ghUser = await getGithubUser(accessToken);
    const email = await getGithubEmail(accessToken);

    let user = await UserModel.findOne({ githubId: ghUser.id });

    if (!user) {
      user = await UserModel.create({
        githubId: ghUser.id,
        login: ghUser.login,
        name: ghUser.name,
        avatarUrl: ghUser.avatar_url,
        email,
        role: "dev",
        githubAccessToken: accessToken,
      });
    } else {
      user.githubAccessToken = accessToken;
      user.login = ghUser.login;
      user.name = ghUser.name;
      user.avatarUrl = ghUser.avatar_url;
      user.email = email ?? user.email;
      await user.save();
    }

    // ⭐ Auto-create default org if missing
    if (!user.defaultOrgId) {
      const org = await OrgModel.create({
        name: `${ghUser.login}'s Team`,
        slug: ghUser.login.toLowerCase(),
        createdBy: user._id,
      });

      user.defaultOrgId = org._id.toString();
      user.orgIds.push(org._id.toString());
      await user.save();
    }

    // ⭐ JWT MUST include defaultOrgId
    const token = createToken({
      id: user._id,
      defaultOrgId: user.defaultOrgId,
    });

    // Set httpOnly cookie with JWT; avoid storing in localStorage
    const isProd = String(process.env.NODE_ENV).toLowerCase() === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Redirect without leaking token/orgId in URL
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    logger.error({ err }, "GitHub OAuth callback failed");
    return res.status(500).json({
      success: false,
      error: { message: "OAuth failed" },
    });
  }
};

export const logoutAndDelete = async (req: any, res: Response) => {
  try {
    const userIdRaw = req.user?.id || req.user?._id;
    if (!userIdRaw || !Types.ObjectId.isValid(String(userIdRaw))) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }

    const userId = new Types.ObjectId(String(userIdRaw));
    const user = await UserModel.findById(userId).lean();

    if (!user) {
      return res.json({ success: true });
    }

    const toObjectId = (value: unknown) => {
      try {
        if (!value) return null;
        const candidate = new Types.ObjectId(String(value));
        return candidate;
      } catch {
        return null;
      }
    };

    const orgIds = Array.isArray(user.orgIds)
      ? user.orgIds.map(toObjectId).filter((value): value is Types.ObjectId => Boolean(value))
      : [];

    const repoIds: Types.ObjectId[] = [];

    if (orgIds.length) {
      const repos = await RepoModel.find({ orgId: { $in: orgIds } }, { _id: 1 }).lean();
      repos.forEach((repo) => {
        const asObjectId = toObjectId(repo?._id);
        if (asObjectId) {
          repoIds.push(asObjectId);
        }
      });
    }

    if (repoIds.length) {
      await Promise.all([
        CommitModel.deleteMany({ repoId: { $in: repoIds } }),
        PRModel.deleteMany({ repoId: { $in: repoIds } }),
      ]);
      await RepoModel.deleteMany({ _id: { $in: repoIds } });
    }

    if (orgIds.length) {
      await Promise.all([
        AlertModel.deleteMany({ orgId: { $in: orgIds } }),
        OrgModel.deleteMany({ _id: { $in: orgIds } }),
      ]);
    }

    await UserModel.deleteOne({ _id: userId });

    // Clear auth cookie
    const isProd = String(process.env.NODE_ENV).toLowerCase() === "production";
    res.clearCookie("token", { path: "/", secure: isProd, sameSite: isProd ? "none" : "lax" });

    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Logout and delete failed");
    return res.status(500).json({ success: false, error: { message: "Logout failed" } });
  }
};
