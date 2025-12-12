"use client";

import { useEffect, useRef } from "react";
import { clearAllClientState, detectStaleSession } from "./autoCleanup";

export default function AutoCleanup() {
  const ran = useRef(false);

  useEffect(() => {
    // Run only once: stale LOCAL state cleanup
    if (!ran.current) {
      ran.current = true;

      // ONLY clear if local/session data is stale
      if (detectStaleSession()) {
        clearAllClientState();
        sessionStorage.setItem("tp:active", "1");
      }
    }
  }, []);

  return null;
}
