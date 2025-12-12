"use client";

export const clearAllClientState = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}

  // Clear ALL cookies for this domain
  try {
    const cookies = document.cookie.split(";");
    for (const c of cookies) {
      const eq = c.indexOf("=");
      const name = eq > -1 ? c.substr(0, eq).trim() : c.trim();
      document.cookie = `${name}=; Max-Age=0; path=/;`;
      document.cookie = `${name}=; Max-Age=0; path=/; Secure; SameSite=None`;
    }
  } catch {}
};

export const detectStaleSession = () => {
  try {
    // 1. No user stored but some old storage present
    if (!sessionStorage.getItem("tp:active") && localStorage.getItem("token")) {
      return true;
    }

    // 2. Old flow tokens still stored (legacy)
    if (localStorage.getItem("token")) return true;

    // 3. If cookie exists but /me fails, we auto-fix (handled in fetchUser)
    return false;
  } catch {
    return false;
  }
};
