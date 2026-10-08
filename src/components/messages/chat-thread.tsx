"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { shrinkImage } from "@/lib/upload-image";
import { sendDirectMessage } from "@/app/me/message-actions";
import { chatTime, personalize, type DirectMessage } from "@/lib/messages";
import { cn } from "@/lib/utils";

type Props = {
  memberId: string;
  /** Whose screen this is: the member, or the pastor's office. */
  viewer: "member" | "pastor";
  initialMessages: DirectMessage[];
  /** When the other side last read the conversation, for the "Seen" ticks. */
  otherReadAt: string | null;
  /** The member's first name, for {name} in quick replies. */
  firstName: string;
  quickReplies?: string[];
  emptyText: string;
  placeholder: string;
};

const TYPING_EVENT = "typing";

function lagosDay(ms: number) {
  return new Date(ms + 3600_000).toISOString().slice(0, 10);
}

function dayLabel(iso: string, now = Date.now()) {
  const day = lagosDay(Date.parse(iso));
  if (day === lagosDay(now)) return "Today";
  if (day === lagosDay(now - 86_400_000)) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "Africa/Lagos" });
}

export function ChatThread({ memberId, viewer, initialMessages, otherReadAt, firstName, quickReplies = [], emptyText, placeholder }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [readAt, setReadAt] = useState(otherReadAt);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null);
  const [busy, setBusy] = useState<"sending" | "uploading" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const lastTypingSent = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const mine = useCallback((m: DirectMessage) => (viewer === "pastor" ? m.from_pastor : !m.from_pastor), [viewer]);

  const markRead = useCallback(() => {
    if (document.visibilityState === "visible") supabase.rpc("mark_conversation_read", { p_member: memberId }).then(() => undefined);
  }, [supabase, memberId]);

  const addMessage = useCallback(
    async (m: DirectMessage) => {
      if (m.image_path && !m.image_url) {
        const { data } = await supabase.storage.from("chat").createSignedUrl(m.image_path, 60 * 60 * 24);
        m = { ...m, image_url: data?.signedUrl ?? null };
      }
      setMessages((list) => (list.some((x) => x.id === m.id) ? list : [...list, m]));
    },
    [supabase]
  );

  // Opening the conversation reads it; refresh so the unread badges clear.
  useEffect(() => {
    supabase.rpc("mark_conversation_read", { p_member: memberId }).then(() => router.refresh());
  }, [supabase, memberId, router]);

  // Live: new messages, "seen" updates and the typing indicator.
  useEffect(() => {
    let live = false;
    const channel = supabase
      .channel(`dm:${memberId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `member_id=eq.${memberId}` }, (payload) => {
        const m = payload.new as DirectMessage;
        addMessage(m);
        if (!mine(m)) {
          setOtherTyping(false);
          markRead();
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations", filter: `member_id=eq.${memberId}` }, (payload) => {
        const c = payload.new as { member_read_at: string | null; pastor_read_at: string | null };
        setReadAt(viewer === "pastor" ? c.member_read_at : c.pastor_read_at);
      })
      .on("broadcast", { event: TYPING_EVENT }, (payload) => {
        if (payload.payload?.from === viewer) return;
        setOtherTyping(true);
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setOtherTyping(false), 4000);
      })
      .subscribe((status) => {
        live = status === "SUBSCRIBED";
      });
    channelRef.current = channel;

    // If live updates can't connect, check for new messages every 20 seconds instead.
    const poll = setInterval(async () => {
      if (live || document.visibilityState !== "visible") return;
      const { data } = await supabase.from("direct_messages").select("*").eq("member_id", memberId).order("created_at", { ascending: false }).limit(20);
      for (const m of ((data ?? []) as DirectMessage[]).reverse()) await addMessage(m);
    }, 20_000);
    const onVisible = () => markRead();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, memberId, viewer, addMessage, markRead, mine]);

  // Keep the newest message in view, including once photos finish loading.
  const atBottom = useRef(true);
  const toBottom = useCallback(() => {
    const el = listRef.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, []);
  useLayoutEffect(() => {
    atBottom.current = true;
    toBottom();
  }, [messages.length, otherTyping, toBottom]);
  // The list shrinks when quick replies open or the phone keyboard appears.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => toBottom());
    observer.observe(el);
    return () => observer.disconnect();
  }, [toBottom]);
  // On phones, bring the whole conversation (with the message box) into view.
  useEffect(() => {
    if (window.innerWidth < 1024) rootRef.current?.scrollIntoView({ block: "end" });
  }, []);

  function typing() {
    const now = Date.now();
    if (now - lastTypingSent.current < 2500) return;
    lastTypingSent.current = now;
    channelRef.current?.send({ type: "broadcast", event: TYPING_EVENT, payload: { from: viewer } });
  }

  async function attach(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only photos can be sent here.");
      return;
    }
    setBusy("uploading");
    setError(null);
    try {
      const blob = await shrinkImage(file, 1280);
      if (blob.size > 5 * 1024 * 1024) throw new Error("That photo is too large. Try a smaller one.");
      const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${memberId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID().slice(0, 12)}.${ext}`;
      const { error } = await supabase.storage.from("chat").upload(path, blob, { contentType: blob.type || file.type });
      if (error) throw new Error("The photo didn't upload. Try again.");
      setPhoto({ path, preview: URL.createObjectURL(blob) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send() {
    if (busy || (!text.trim() && !photo)) return;
    setBusy("sending");
    setError(null);
    const result = await sendDirectMessage({ memberId, body: text, imagePath: photo?.path ?? null });
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (result.message) await addMessage(photo ? { ...result.message, image_url: photo.preview } : result.message);
    setText("");
    setPhoto(null);
  }

  const lastMine = [...messages].reverse().find(mine);

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col">
      <div
        ref={listRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-5 sm:px-6"
        aria-live="polite"
      >
        {messages.length === 0 && <p className="mx-auto mt-10 max-w-sm text-center text-sm leading-relaxed text-paper-dim">{emptyText}</p>}
        {messages.map((m, i) => {
          const me = mine(m);
          const prev = messages[i - 1];
          const newDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at);
          const seen = me && readAt && m.created_at <= readAt;
          return (
            <div key={m.id}>
              {newDay && (
                <p className="my-4 text-center">
                  <span className="rounded-full bg-dusk px-3 py-1 text-xs text-paper-dim">{dayLabel(m.created_at)}</span>
                </p>
              )}
              <div className={cn("flex", me ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-3.5 py-2 shadow-sm",
                    me ? "rounded-br-sm bg-[#1d3263] text-starlight" : "rounded-bl-sm border border-steel bg-white text-paper"
                  )}
                >
                  {viewer === "pastor" && m.from_pastor && m.broadcast_id && <p className="mb-0.5 text-[11px] text-lamp">Sent to many</p>}
                  {m.image_url && (
                    <a href={m.image_url} target="_blank" rel="noopener noreferrer" className="mb-1.5 block max-w-72 overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.image_url} alt="Photo" onLoad={toBottom} className="max-h-60 w-full object-cover" />
                    </a>
                  )}
                  {m.body && <p className="whitespace-pre-line break-words leading-relaxed [overflow-wrap:anywhere]">{m.body}</p>}
                  <p className={cn("mt-0.5 flex items-center justify-end gap-1 text-[11px]", me ? "text-starlight-dim" : "text-paper-dim")}>
                    {chatTime(m.created_at)}
                    {me && (
                      <span className={seen ? "text-lamp" : undefined} aria-label={seen ? "Seen" : "Sent"}>
                        {seen ? "✓✓" : "✓"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {me && m.id === lastMine?.id && seen && <p className="mt-0.5 text-right text-[11px] text-paper-dim">Seen</p>}
            </div>
          );
        })}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-steel bg-white px-4 py-3" aria-label="Typing">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-paper-dim" style={{ animationDelay: `${d * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-steel bg-white/80 px-3 py-3 sm:px-4">
        {showReplies && quickReplies.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setText(personalize(q, firstName));
                  setShowReplies(false);
                }}
                className="rounded-full border border-steel bg-white px-3 py-1 text-left text-xs text-paper hover:border-gold"
              >
                {personalize(q, firstName)}
              </button>
            ))}
          </div>
        )}
        {photo && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.preview} alt="" className="h-14 w-14 rounded-md object-cover" />
            <button type="button" onClick={() => setPhoto(null)} className="text-xs text-paper-dim hover:text-[#8a2f1e]">
              Remove photo
            </button>
          </div>
        )}
        {error && <p className="mb-2 text-sm text-[#8a2f1e]">{error}</p>}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => attach(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-paper-dim hover:bg-dusk hover:text-paper disabled:opacity-50"
            aria-label="Add a photo"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.5" />
              <path d="M21 16l-5-5-8 8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {quickReplies.length > 0 && (
            <button
              type="button"
              onClick={() => setShowReplies((v) => !v)}
              className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-dusk", showReplies ? "text-gold-text" : "text-paper-dim")}
              aria-label="Quick replies"
              title="Quick replies"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M13 2L4 14h7l-1 8 9-12h-7z" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              typing();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder={busy === "uploading" ? "Uploading photo…" : placeholder}
            className="max-h-40 min-h-10 flex-1 resize-none rounded-2xl border border-steel bg-white px-4 py-2 text-sm leading-relaxed text-paper outline-none [field-sizing:content] focus:border-gold"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy !== null || (!text.trim() && !photo)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-ink transition-colors hover:bg-gold-soft disabled:opacity-40"
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M3.4 20.4l17.5-7.5a1 1 0 0 0 0-1.8L3.4 3.6a1 1 0 0 0-1.4 1.1L4 11l9 1-9 1-2 6.3a1 1 0 0 0 1.4 1.1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
