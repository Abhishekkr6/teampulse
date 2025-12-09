import axios from "axios";

export const exchangeCodeForToken = async (code: string) => {
  if (!code) {
    throw new Error("Missing OAuth code");
  }
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing GitHub OAuth env (GITHUB_CLIENT_ID/SECRET)");
  }
  try {
    const res = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: { Accept: "application/json" },
      }
    );
    if (!res.data?.access_token) {
      const errMsg = `No access_token in response: ${JSON.stringify(res.data)}`;
      throw new Error(errMsg);
    }
    return res.data.access_token;
  } catch (error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const detail = `GitHub token exchange failed${status ? ` (status ${status})` : ""}: ${data ? JSON.stringify(data) : error?.message}`;
    const wrapped = new Error(detail);
    (wrapped as any).cause = error;
    throw wrapped;
  }
};

export const getGithubUser = async (token: string) => {
  if (!token) throw new Error("Missing GitHub access token");
  try {
    const res = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    throw new Error(`GitHub user fetch failed${status ? ` (status ${status})` : ""}: ${data ? JSON.stringify(data) : error?.message}`);
  }
};

export const getGithubEmail = async (token: string) => {
  if (!token) throw new Error("Missing GitHub access token");
  try {
    const res = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.find((e: any) => e.primary)?.email;
  } catch (error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    throw new Error(`GitHub email fetch failed${status ? ` (status ${status})` : ""}: ${data ? JSON.stringify(data) : error?.message}`);
  }
};
