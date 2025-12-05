import { Request, Response } from "express";
import {
  exchangeCodeForToken,
  getGithubUser,
  getGithubEmail,
} from "../services/github.service";
import { UserModel } from "../models/user.model";
import { createToken } from "../services/jwt.service";
import logger from "../utils/logger";

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
        githubAccessToken: accessToken, // ⭐ SAVE TOKEN HERE
      });
    } else {
      // ⭐ UPDATE EXISTING USER TOKEN
      user.githubAccessToken = accessToken;
      user.login = ghUser.login;
      user.name = ghUser.name;
      user.avatarUrl = ghUser.avatar_url;
      user.email = email ?? user.email;
      await user.save();
    }

    // ⭐ MINIMAL JWT ONLY WITH USER ID
    const token = createToken({ id: user._id });

    return res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
  } catch (err) {
    logger.error({ err }, "GitHub OAuth callback failed");
    return res.status(500).json({
      success: false,
      error: { message: "OAuth failed" },
    });
  }
};
