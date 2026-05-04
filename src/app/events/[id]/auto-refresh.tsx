"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polls the route every `intervalMs` so server-fetched data (activity feed,
// zone counts) feels live without standing up a websocket.
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
