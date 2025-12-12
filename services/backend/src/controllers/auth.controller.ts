import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  exchangeCodeForToken,
  getGithubUser,
  getGithubEmail,
} from "../services/github.service";
import { UserModel } from "../models/user.model";
import { OrgModel } from "../models/org.model";
import { createToken } from "../services/jwt.service";
import logger from "../utils/logger";
import { RepoModel } from "../models/repo.model";
import { CommitModel } from "../models/commit.model";
import { PRModel } from "../models/pr.model";
import { AlertModel } from "../models/alert.model";

/**
 * Redirect user to GitHub OAuth page
 */
export const githubLogin = async (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirect = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
  return res.redirect(redirect);
};

/**
 * GitHub OAuth callback:
 * - exchange code for access token
 * - fetch GitHub profile + primary email
 * - upsert user by githubId (no duplicates)
 * - ensure a valid default org exists and is stored as ObjectId
 * - issue httpOnly cookie(s) with JWT
 */
export const githubCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      logger.warn({ query: req.query }, "Missing OAuth code in callback");
      return res
        .status(400)
        .json({ success: false, error: { message: "Missing OAuth code" } });
    }

    const accessToken = await exchangeCodeForToken(code);
    const ghUser = await getGithubUser(accessToken);
    const email = await getGithubEmail(accessToken);

    // Find user by githubId (unique canonical identity)
    // If multiple records somehow exist, pick the first and consolidate later with a migration script.
    let user = await UserModel.findOne({ githubId: ghUser.id });

    if (!user) {
      user = await UserModel.create({
        githubId: ghUser.id,
        login: ghUser.login,
        name: ghUser.name ?? ghUser.login,
        avatarUrl: ghUser.avatar_url,
        email,
        role: "dev",
        githubAccessToken: accessToken,
        orgIds: [],
      });
    } else {
      // Update latest profile + token
      user.githubAccessToken = accessToken;
      user.login = ghUser.login ?? user.login;
      user.name = ghUser.name ?? user.name;
      user.avatarUrl = ghUser.avatar_url ?? user.avatarUrl;
      user.email = email ?? user.email;
      // Normalize orgIds array to ObjectIds on-the-fly if needed
      if (!Array.isArray(user.orgIds)) user.orgIds = [];
      await user.save();
    }

    // Ensure default org exists and is valid. If user's defaultOrgId references a missing org, recreate.
    const ensureOrgForUser = async () => {
      // If user has a defaultOrgId, verify it exists
      if (user.defaultOrgId) {
        try {
          const existing = await OrgModel.findById(user.defaultOrgId).lean();
          if (existing) return existing;
          // If referenced org was deleted, fallthrough to create new
        } catch {
          // ignore and create new
        }
      }

      // Create or find by slug
      const baseSlug =
        (ghUser.login && String(ghUser.login).toLowerCase()) ||
        `user-${String(user._id)}`;
      let org = await OrgModel.findOne({ slug: baseSlug });

      if (!org) {
        // Try create; if duplicate occurs, attempt suffixes
        try {
          org = await OrgModel.create({
            name: `${ghUser.login ?? user.name}'s Team`,
            slug: baseSlug,
            createdBy: user._id,
          });
        } catch (createErr: any) {
          const isDup =
            typeof createErr?.message === "string" &&
            createErr.message.includes("E11000");
          if (!isDup) throw createErr;

          for (let i = 2; i <= 100; i++) {
            const candidate = `${baseSlug}-${i}`;
            const exists = await OrgModel.findOne({ slug: candidate });
            if (!exists) {
              org = await OrgModel.create({
                name: `${ghUser.login ?? user.name}'s Team`,
                slug: candidate,
                createdBy: user._id,
              });
              break;
            }
          }
          if (!org) {
            throw new Error(
              "Unable to allocate unique org slug after multiple attempts"
            );
          }
        }
      }

      // Save ObjectId references reliably
      const orgId = org._id as Types.ObjectId;
      user.defaultOrgId = orgId;
      if (!Array.isArray(user.orgIds)) user.orgIds = [];
      const already = (user.orgIds as any[]).some(
        (entry) =>
          String(entry) === String(orgId) ||
          (entry && typeof entry === "object" && String(entry._id) === String(orgId))
      );
      if (!already) user.orgIds.push(orgId as any);
      await user.save();
      return org;
    };

    await ensureOrgForUser();

    // Create application JWT (payload minimal: user id as string)
    const token = createToken({ id: String(user._id) });

    // Clear any stale/old cookies first to avoid conflicts (best-effort)
    try {
      res.clearCookie("teampulse_token", { path: "/" });
      res.clearCookie("token", { path: "/" });
    } catch {
      /* ignore */
    }

    // Set httpOnly cookie; secure in production, choose sameSite based on deployment
    const isProd = String(process.env.NODE_ENV).toLowerCase() === "production";
    const sameSite = isProd ? "none" : "lax";

    // Primary cookie
    res.cookie("teampulse_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSite as any,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Fallback/compat cookie name for older clients expecting 'token'
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSite as any,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // Redirect to frontend without leaking token in URL
    if (!process.env.FRONTEND_URL) {
      logger.warn("FRONTEND_URL is not set; responding with JSON");
      return res.json({ success: true });
    }
    const frontend = process.env.FRONTEND_URL.replace(/\/$/, "");
    return res.redirect(`https://teampulse18.vercel.app/auth/callback`);
  } catch (err) {
    logger.error({ err }, "GitHub OAuth callback failed");
    const message = (err as any)?.message || "OAuth callback failed";
    return res.status(500).json({ success: false, error: { message } });
  }
};

/**
 * Delete user and cleanup all related data (repos, commits, PRs, alerts, orgs).
 * Clears cookies on success.
 */
export const logoutAndDelete = async (req: any, res: Response) => {
  try {
    const userIdRaw = req.user?.id || req.user?._id;
    if (!userIdRaw || !Types.ObjectId.isValid(String(userIdRaw))) {
      return res
        .status(401)
        .json({ success: false, error: { message: "Unauthorized" } });
    }

    const userId = new Types.ObjectId(String(userIdRaw));
    const user = await UserModel.findById(userId).lean();

    if (!user) {
      // ensure cookies cleared even if user not found
      const isProdLogout = String(process.env.NODE_ENV).toLowerCase() === "production";
      const sameSite = isProdLogout ? "none" : "lax";
      res.clearCookie("teampulse_token", { path: "/", secure: isProdLogout, sameSite });
      res.clearCookie("token", { path: "/", secure: isProdLogout, sameSite });
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
      ? user.orgIds
          .map(toObjectId)
          .filter((value): value is Types.ObjectId => Boolean(value))
      : [];

    const repoIds: Types.ObjectId[] = [];

    if (orgIds.length) {
      const repos = await RepoModel.find(
        { orgId: { $in: orgIds } },
        { _id: 1 }
      ).lean();
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

    // Clear session cookies on logout (respect SameSite for cross-site)
    const isProdLogout = String(process.env.NODE_ENV).toLowerCase() === "production";
    const sameSite = isProdLogout ? "none" : "lax";
    res.clearCookie("teampulse_token", { path: "/", secure: isProdLogout, sameSite });
    res.clearCookie("token", { path: "/", secure: isProdLogout, sameSite });

    return res.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Logout and delete failed");
    return res
      .status(500)
      .json({ success: false, error: { message: "Logout failed" } });
  }
};
