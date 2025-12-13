"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../..//lib/api";
import { useUserStore } from "../../..//store/userStore";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finalize = async () => {
      // give a tiny delay for cookie to be stored via proxy
      await new Promise((r) => setTimeout(r, 250));

      try {
        // This call goes to /api/v1/me which Next rewrites to backend.
        // axios has withCredentials=true so cookie will be forwarded.
        await useUserStore.getState().fetchUser();
        router.replace("/dashboard");
      } catch (err) {
        // fallback: go to login
        router.replace("/");
      }
    };

    finalize();
  }, []);

  return <div className="p-6 text-lg">Finishing login…</div>;
}
