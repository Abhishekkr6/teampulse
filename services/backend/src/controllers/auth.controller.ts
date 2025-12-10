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
    if (!code) {
      logger.warn({ query: req.query }, "Missing OAuth code in callback");
      return res.status(400).json({ success: false, error: { message: "Missing OAuth code" } });
    }

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

    // ⭐ Auto-create default org if missing, handle slug conflicts gracefully
    if (!user.defaultOrgId) {
      const baseSlug = ghUser.login?.toLowerCase() || `user-${String(user._id)}`;
      let org = await OrgModel.findOne({ slug: baseSlug });
      if (!org) {
        // Attempt create with unique slug; if conflict, generate a suffixed slug
        try {
          org = await OrgModel.create({
            name: `${ghUser.login}'s Team`,
            slug: baseSlug,
            createdBy: user._id,
          });
        } catch (createErr: any) {
          const isDup = typeof createErr?.message === "string" && createErr.message.includes("E11000");
          if (!isDup) throw createErr;
          // Generate unique slug with numeric suffix
          for (let i = 2; i <= 50; i++) {
            const candidate = `${baseSlug}-${i}`;
            const exists = await OrgModel.findOne({ slug: candidate });
            if (!exists) {
              org = await OrgModel.create({
                name: `${ghUser.login}'s Team`,
                slug: candidate,
                createdBy: user._id,
              });
              break;
            }
          }
          if (!org) {
            throw new Error("Unable to allocate unique org slug after multiple attempts");
          }
        }
      }

      user.defaultOrgId = org._id.toString();
      const orgIdStr = org._id.toString();
      if (!Array.isArray(user.orgIds)) user.orgIds = [] as any;
      if (!user.orgIds.includes(orgIdStr)) {
        user.orgIds.push(orgIdStr);
      }
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

    // Redirect with token for frontend to set first-party cookie
    if (!process.env.FRONTEND_URL) {
      logger.warn("FRONTEND_URL is not set; responding with JSON");
      return res.json({ success: true, token });
    }
    const frontend = process.env.FRONTEND_URL.replace(/\/$/, "");
    return res.redirect(`${frontend}/dashboard?token=${encodeURIComponent(token)}`);
  } catch (err) {
    logger.error({ err }, "GitHub OAuth callback failed");
    const message = (err as any)?.message || "OAuth callback failed";
    return res.status(500).json({ success: false, error: { message } });
  }
};
