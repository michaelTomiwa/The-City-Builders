"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";

/**
 * Upload an image (tap to choose, or drag and drop), or paste a link.
 * The chosen image's URL is submitted with the form under `name`.
 */
export function ImageField({
  name,
  label,
  value: controlled,
  defaultValue = "",
  onChange,
  folder,
  hint,
  aspect = "aspect-[16/9]",
  keepOriginal = false,
  fit = "cover",
  previewClassName,
}: {
  name: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (url: string) => void;
  folder?: string;
  hint?: string;
  aspect?: string;
  /** don't resize or convert (logos with transparent backgrounds) */
  keepOriginal?: boolean;
  fit?: "cover" | "contain";
  previewClassName?: string;
}) {
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function set(url: string) {
    setOwn(url);
    onChange?.(url);
  }

  async function handle(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      set(await uploadImage(file, folder, keepOriginal));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-paper">{label}</p>
      <input type="hidden" name={name} value={value} />
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {value ? (
        <div className="group relative mt-2 overflow-hidden rounded-sm border border-steel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className={cn("w-full", fit === "contain" ? "object-contain p-4" : "object-cover", aspect, previewClassName)}
          />
          {busy && <Spinner />}
          <div className="flex gap-3 border-t border-steel bg-white px-3 py-2 text-sm">
            <button type="button" onClick={() => input.current?.click()} className="text-gold-text hover:underline">
              Replace
            </button>
            <button type="button" onClick={() => set("")} className="text-[#8a2f1e] hover:underline">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handle(e.dataTransfer.files?.[0]);
          }}
          disabled={busy}
          className={cn(
            "relative mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed px-4 text-center transition-colors",
            aspect,
            dragging ? "border-gold bg-gold/10" : "border-steel bg-white hover:border-gold hover:bg-gold/5"
          )}
        >
          {busy ? (
            <Spinner />
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-gold-text" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="m21 16-5-5-9 9" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-paper">Upload an image</span>
              <span className="text-xs text-paper-dim">Tap to choose, or drag one here</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-[#8a2f1e]" role="alert">
          {error}
        </p>
      )}

      {showLink ? (
        <input
          type="url"
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder="https://"
          aria-label={`${label} link`}
          className="mt-2 h-10 w-full rounded-sm border border-steel bg-white px-3 text-sm text-paper outline-none focus:border-gold"
        />
      ) : (
        <button type="button" onClick={() => setShowLink(true)} className="mt-2 text-xs text-paper-dim underline-offset-4 hover:underline">
          Or paste an image link
        </button>
      )}
      {hint && <p className="mt-1 text-xs text-paper-dim">{hint}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-paper" role="status">
      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      Uploading…
    </span>
  );
}
