"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // CRITICAL: clear stale browser state BEFORE dashboard loads
    localStorage.clear();
    sessionStorage.clear();

    // Reset cookies client-side as backup (in case server didn't clear)
    document.cookie = "teampulse_token=; Max-Age=0; path=/;";
    document.cookie = "token=; Max-Age=0; path=/;";

    // Now redirect to dashboard
    router.replace("/dashboard");
  }, []);

  return <div>Signing you in…</div>;
}
