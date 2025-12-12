"use client";

import { useEffect } from "react";
import { clearAllClientState, detectStaleSession } from "./autoCleanup";

export default function AutoCleanup() {
  useEffect(() => {
    if (detectStaleSession()) {
      clearAllClientState();
      sessionStorage.setItem("tp:active", "1");

      // redirect to callback for fresh login
      window.location.replace("/auth/callback");
    }
  }, []);

  return null;
}
