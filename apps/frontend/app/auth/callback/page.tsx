"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../../store/userStore"; // update path if needed

// small helper to wipe client cookies (best-effort)
const clearClientCookies = () => {
  // Clear common cookie names used by the app
  document.cookie = "teampulse_token=; Max-Age=0; path=/;";
  document.cookie = "token=; Max-Age=0; path=/;";

  // Best-effort: remove cookies set on domain root or other paths
  const cookies = document.cookie.split(";").map(c => c.trim().split("=")[0]);
  cookies.forEach(name => {
    try {
      document.cookie = `${name}=; Max-Age=0; path=/;`;
    } catch {}
  });
};

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // 1) Full local wipe
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // ignore if storage access blocked
    }

    // 2) Remove client-side cookies (best-effort)
    clearClientCookies();

    // 3) Reset Zustand store immediately (prevent previous data flash)
    try {
      useUserStore.setState({
        user: null,
        activeOrgId: null,
        loading: true,
      });
    } catch {}

    // 4) Short tick to let state settle, then navigate to dashboard where fetchUser will run
    setTimeout(() => {
      // navigate to the place your app expects (dashboard)
      router.replace("/dashboard");
    }, 100);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="p-6 text-lg">Signing you in…</div>;
}
