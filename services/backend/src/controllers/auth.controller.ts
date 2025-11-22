import { Request, Response } from "express";
import { exchangeCodeForToken, getGithubUser, getGithubEmail } from "../services/github.service.js";
import { UserModel } from "../models/user.model.js";
import { createToken } from "../services/jwt.service.js";

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
      });
    }

    const token = createToken({
      id: user._id,
      githubId: user.githubId,
      email: user.email,
    });

    return res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, error: { message: "OAuth failed" } });
  }
};
