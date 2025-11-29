"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (token) {
      localStorage.setItem("token", token);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
      router.push("/dashboard");
    }
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <a
        href="https://teampulse18.vercel.app/api/v1/auth/github/login"
        className="px-6 py-3 bg-black text-white rounded-lg"
      >
        Login with GitHub
      </a>
    </div>
  );
}
