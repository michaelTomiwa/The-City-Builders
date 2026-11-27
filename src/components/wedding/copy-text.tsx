"use client";

import { useState } from "react";

export function CopyText({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="text-[var(--wed-gold)] underline decoration-1 underline-offset-4 hover:text-[var(--wed-lace)]"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
