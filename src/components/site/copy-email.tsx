"use client";

import { useState } from "react";
import { CHURCH_EMAIL } from "@/lib/schedule";

export function CopyEmail({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CHURCH_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${CHURCH_EMAIL}`;
    }
  }

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {copied ? "Copied" : "Copy address"}
    </button>
  );
}
