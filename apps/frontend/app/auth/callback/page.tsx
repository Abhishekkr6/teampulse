"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAllClientState } from "../../../components/Auth/autoCleanup";
import { useUserStore } from "../../../store/userStore";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // full wipe of local/session/cookies
    clearAllClientState();

    // reset global user store
    useUserStore.setState({
      user: null,
      activeOrgId: null,
      loading: true,
    });

    // after cleaning, fetch fresh user data
    setTimeout(() => {
      router.replace("/dashboard");
    }, 150);
  }, []);

  return (
    <div className="p-6 text-lg text-slate-700">
      Preparing your fresh login…
    </div>
  );
}
