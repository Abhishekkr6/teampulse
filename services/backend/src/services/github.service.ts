import axios from "axios";

export const exchangeCodeForToken = async (code: string) => {
  const res = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    {
      headers: { Accept: "application/json" },
    }
  );

  return res.data.access_token;
};

export const getGithubUser = async (token: string) => {
  const res = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

export const getGithubEmail = async (token: string) => {
  const res = await axios.get("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data.find((e: any) => e.primary)?.email;
};
