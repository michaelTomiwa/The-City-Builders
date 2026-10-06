"use client";

import { useEffect } from "react";
import { applySky } from "@/lib/sky";

/** Keeps the sky in step with Lagos time while the page stays open. */
export function SkyClock() {
  useEffect(() => {
    applySky();
    const id = setInterval(applySky, 60_000);
    return () => clearInterval(id);
  }, []);
  return null;
}
