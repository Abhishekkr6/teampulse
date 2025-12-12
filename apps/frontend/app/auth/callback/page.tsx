"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAllClientState } from "../../../components/Auth/autoCleanup";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // We do NOT clear cookie here — cookie IS the login
    clearAllClientState(); // clears local + session only

    // allow cookie to sync (important)
    setTimeout(() => {
      router.replace("/dashboard");
    }, 150);
  }, []);

  return <div className="p-6 text-lg">Finishing login…</div>;
}
