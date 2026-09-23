"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-renders the current server page every `seconds` while the tab is visible. Form input is kept. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
