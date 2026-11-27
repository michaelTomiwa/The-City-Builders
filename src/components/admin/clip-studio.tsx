"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LOGO_SVG } from "@/lib/brand";
import { chunkCues, cueAt, cueId, formatTime, parseCaptions, parseTime, toSrt, type Cue } from "@/lib/captions";
import { clipAudio, loudness, snapToVoice, speechOnly } from "@/lib/clip-audio";
import { END_CARD_SECONDS, drawFrame, frameSize, pickRecordingType, type Assets, type ClipSettings } from "@/lib/clip-draw";

const MAX_SECONDS = 10 * 60;
const SHORT_SECONDS = 3 * 60;

type Source = { url: string; name: string; file: File };
type Auto =
  | { phase: "idle" }
  | { phase: "audio"; progress: number | null }
  | { phase: "download"; progress: number }
  | { phase: "listening" }
  | { phase: "error"; message: string };

const MODELS = [
  ["Xenova/whisper-base.en", "Quick · about 80 MB"],
  ["Xenova/whisper-small.en", "Most accurate · about 250 MB"],
] as const;
// Roughly how much each model downloads, so the bar doesn't jump back as each new file starts.
const MODEL_BYTES: Record<string, number> = { "Xenova/whisper-base.en": 80e6, "Xenova/whisper-small.en": 250e6 };
type Model = (typeof MODELS)[number][0];
type Result = { url: string; ext: string; size: number; seconds: number };
type Job = { phase: "idle" } | { phase: "working"; progress: number } | { phase: "done"; result: Result } | { phase: "error"; message: string };

const once = (el: HTMLMediaElement, event: string) => new Promise<void>((resolve) => el.addEventListener(event, () => resolve(), { once: true }));
const baseName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "clip";

/** Fonts and the City Builders mark, ready for the canvas. */
async function loadAssets(): Promise<Assets> {
  const cs = getComputedStyle(document.documentElement);
  const display = `${cs.getPropertyValue("--font-gloock").trim() || "Georgia"}, serif`;
  const sans = `${cs.getPropertyValue("--font-hanken").trim() || "system-ui"}, sans-serif`;
  await Promise.all([document.fonts.load(`400 40px ${display}`), document.fonts.load(`800 40px ${sans}`), document.fonts.load(`500 40px ${sans}`)]).catch(() => {});
  const logo = new Image();
  logo.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LOGO_SVG.replace("<svg ", '<svg width="688" height="512" '))}`;
  await logo.decode().catch(() => {});
  return { logo: logo.complete && logo.naturalWidth ? logo : null, display, sans };
}

export function ClipStudio({ siteHost }: { siteHost: string }) {
  const [source, setSource] = useState<Source | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [cues, setCues] = useState<Cue[]>([]);
  const [captionNote, setCaptionNote] = useState<string | null>(null);
  const [auto, setAuto] = useState<Auto>({ phase: "idle" });
  const [model, setModel] = useState<Model>(MODELS[0][0]);
  const [tick, setTick] = useState(0);
  const worker = useRef<Worker | null>(null);
  const autoAbort = useRef<AbortController | null>(null);
  const [job, setJob] = useState<Job>({ phase: "idle" });
  const [dragging, setDragging] = useState(false);
  const [s, setS] = useState<ClipSettings>({
    aspect: "9:16",
    quality: 1080,
    layout: "fill",
    focus: 0.5,
    zoom: 1,
    captionsOn: true,
    shortPhrases: true,
    captionStyle: "outline",
    captionSize: "m",
    captionPos: "bottom",
    title: "",
    showLogo: true,
    showName: true,
    nameLine: "Pastor Michael Tomiwa · The City Builders",
    endCard: true,
    endLine: siteHost,
  });
  const set = <K extends keyof ClipSettings>(key: K, value: ClipSettings[K]) => setS((prev) => ({ ...prev, [key]: value }));

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const assets = useRef<Assets>({ logo: null, display: "serif", sans: "sans-serif" });
  const cardStart = useRef<number | null>(null);
  const cancelled = useRef(false);

  const shown = useMemo(() => (s.shortPhrases ? chunkCues(cues) : cues), [cues, s.shortPhrases]);
  const live = useRef({ s, shown, start, end });
  useEffect(() => {
    live.current = { s, shown, start, end };
  }, [s, shown, start, end]);

  useEffect(() => {
    loadAssets().then((a) => (assets.current = a));
  }, []);

  // The live preview: the same drawing the export uses, every frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (v && c && ctx && v.readyState >= 2) {
        const L = live.current;
        if (!v.paused && v.currentTime >= L.end) {
          v.pause();
          if (L.s.endCard) cardStart.current = performance.now();
        }
        let cardT: number | null = null;
        if (cardStart.current !== null) {
          cardT = (performance.now() - cardStart.current) / 1000;
          if (cardT > END_CARD_SECONDS) {
            cardStart.current = null;
            cardT = null;
          }
        }
        drawFrame(ctx, c.width, c.height, v, { rel: v.currentTime - L.start, cardT, caption: cueAt(L.shown, v.currentTime)?.text ?? null, s: L.s, a: assets.current });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => {
    if (source) URL.revokeObjectURL(source.url);
  }, [source]);

  function openFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|mkv)$/i.test(file.name)) {
      setVideoError("That isn't a video file. Choose an MP4, MOV or WebM.");
      return;
    }
    if (job.phase === "done") URL.revokeObjectURL(job.result.url);
    setVideoError(null);
    setJob({ phase: "idle" });
    setDuration(0);
    setCurrent(0);
    setSource({ url: URL.createObjectURL(file), name: file.name, file });
  }

  function onLoaded() {
    const v = videoRef.current;
    if (!v) return;
    const d = Number.isFinite(v.duration) ? v.duration : 0;
    setDuration(d);
    setStart(0);
    setEnd(Math.min(d, SHORT_SECONDS));
    setCurrent(0);
  }

  function seek(t: number) {
    const v = videoRef.current;
    if (!v) return;
    cardStart.current = null;
    v.currentTime = Math.max(0, Math.min(duration, t));
    setCurrent(v.currentTime);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (!v.paused) return v.pause();
    cardStart.current = null;
    if (v.currentTime < start || v.currentTime >= end - 0.05) v.currentTime = start;
    v.play().catch(() => {});
  }

  function setTrim(which: "start" | "end", t: number) {
    const value = Math.max(0, Math.min(duration, t));
    if (which === "start") setStart(Math.min(value, end - 1));
    else setEnd(Math.max(value, start + 1));
  }

  // A clock for "Writing captions… 0:42" (seconds since it started listening).
  useEffect(() => {
    if (auto.phase !== "listening") return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [auto.phase]);
  useEffect(() => () => worker.current?.terminate(), []);

  function stopAuto() {
    autoAbort.current?.abort();
    worker.current?.terminate();
    worker.current = null;
    setAuto({ phase: "idle" });
  }

  async function autoCaptions() {
    if (!source) return;
    const from = start;
    const to = end;
    videoRef.current?.pause();
    setCaptionNote(null);
    const abort = new AbortController();
    autoAbort.current = abort;
    setAuto({ phase: "audio", progress: null });
    let audio: Float32Array;
    try {
      audio = await clipAudio(source.file, source.url, from, to, (p) => setAuto({ phase: "audio", progress: p }), abort.signal);
    } catch {
      setAuto({ phase: "error", message: "Couldn't read the sound from this video. Try the MP4 from YouTube Studio." });
      return;
    }
    if (abort.signal.aborted) return;
    if (!audio.some((x) => Math.abs(x) > 0.001)) {
      setAuto({ phase: "error", message: "This part of the video has no sound to caption." });
      return;
    }

    const level = loudness(audio);
    const w = worker.current ?? new Worker(new URL("../../lib/whisper-worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    const files = new Map<string, [number, number]>();
    let shown = 0;
    setAuto({ phase: "download", progress: 0 });
    const onMessage = (e: MessageEvent) => {
      const m = e.data;
      if (m.type === "done" || m.type === "error") w.removeEventListener("message", onMessage);
      if (m.type === "download") {
        files.set(m.file, [m.loaded, m.total]);
        let got = 0;
        let all = 0;
        files.forEach(([l, t]) => ((got += l), (all += t)));
        shown = Math.max(shown, Math.min(0.99, got / Math.max(all, MODEL_BYTES[model] ?? all)));
        setAuto({ phase: "download", progress: shown });
      } else if (m.type === "listening") {
        setTick(0);
        setAuto({ phase: "listening" });
      } else if (m.type === "done") {
        const heard = (m.chunks as { text: string; timestamp: [number, number | null] }[]).map((c) => ({
          start: c.timestamp[0],
          end: Math.min(c.timestamp[1] ?? to - from, to - from),
          text: speechOnly(c.text),
        }));
        const made: Cue[] = snapToVoice(heard, level)
          .filter((c) => c.text && c.end > c.start)
          .map((c) => ({ id: cueId(), start: from + c.start, end: from + c.end, text: c.text }));
        setCues((prev) => [...prev.filter((c) => c.end <= from || c.start >= to), ...made].sort((a, b) => a.start - b.start));
        setCaptionNote(made.length ? `Wrote ${made.length} captions. Read through them below and fix any word it misheard.` : "It didn't hear any speech in this clip.");
        setAuto({ phase: "idle" });
      } else if (m.type === "error") {
        setAuto({ phase: "error", message: "Auto captions stopped. Check your internet connection (the first time downloads the speech AI) and try again." });
      }
    };
    w.addEventListener("message", onMessage);
    w.addEventListener("error", () => setAuto({ phase: "error", message: "Auto captions couldn't start in this browser. Use the latest Chrome or Edge." }), { once: true });
    w.postMessage({ audio, model }, [audio.buffer]);
  }

  async function openCaptions(file: File | undefined) {
    if (!file) return;
    const parsed = parseCaptions(await file.text());
    if (!parsed.length) {
      setCaptionNote("No captions found in that file. Use the .srt or .vtt file from YouTube Studio.");
      return;
    }
    setCues(parsed);
    const inClip = parsed.filter((c) => c.end > start && c.start < end).length;
    setCaptionNote(`Loaded ${parsed.length} lines (${inClip} in this clip).`);
  }

  function addCue() {
    const at = Math.max(start, current);
    const cue: Cue = { id: cueId(), start: at, end: Math.min(at + 2.5, end), text: "New caption" };
    setCues((prev) => [...prev, cue].sort((a, b) => a.start - b.start));
  }

  const updateCue = (id: string, patch: Partial<Cue>) => setCues((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)).sort((a, b) => a.start - b.start));
  const removeCue = (id: string) => setCues((prev) => prev.filter((c) => c.id !== id));

  function downloadSrt() {
    const inClip = shown.filter((c) => c.end > start && c.start < end).map((c) => ({ ...c, start: Math.max(c.start, start), end: Math.min(c.end, end) }));
    const blob = new Blob([toSrt(inClip, start)], { type: "application/x-subrip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${baseName(source?.name ?? "clip")}-captions.srt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function exportClip() {
    if (!source) return;
    const type = pickRecordingType();
    if (!type) {
      setJob({ phase: "error", message: "This browser can't record video. Use Chrome or Edge on a computer." });
      return;
    }
    videoRef.current?.pause();
    cancelled.current = false;
    setJob({ phase: "working", progress: 0 });

    const settings = s;
    const lines = shown;
    const { w, h } = frameSize(settings.aspect, settings.quality);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const v = document.createElement("video");
    v.src = source.url;
    v.playsInline = true;
    v.preload = "auto";
    let audio: AudioContext | null = null;

    try {
      if (!ctx) throw new Error("no canvas");
      if (v.readyState < 1) await once(v, "loadedmetadata");
      audio = new AudioContext();
      const dest = audio.createMediaStreamDestination();
      audio.createMediaElementSource(v).connect(dest);
      const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: settings.quality === 1080 ? 8_000_000 : 5_000_000, audioBitsPerSecond: 160_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

      v.currentTime = start;
      await once(v, "seeked");
      const total = end - start + (settings.endCard ? END_CARD_SECONDS : 0);
      const paint = (cardT: number | null) =>
        drawFrame(ctx, w, h, v, { rel: v.currentTime - start, cardT, caption: cueAt(lines, v.currentTime)?.text ?? null, s: settings, a: assets.current });
      paint(null);

      recorder.start(1000);
      await audio.resume();
      await v.play();

      await new Promise<void>((resolve) => {
        let cardFrom: number | null = null;
        let lastShown = 0;
        const frame = () => {
          if (cancelled.current) return resolve();
          const now = performance.now();
          if (cardFrom === null && (v.currentTime >= end || v.ended)) {
            v.pause();
            if (!settings.endCard) return resolve();
            cardFrom = now;
          }
          const cardT = cardFrom === null ? null : (now - cardFrom) / 1000;
          if (cardT !== null && cardT >= END_CARD_SECONDS) return resolve();
          paint(cardT);
          if (now - lastShown > 250) {
            lastShown = now;
            const done = cardT === null ? v.currentTime - start : end - start + cardT;
            setJob({ phase: "working", progress: Math.min(1, done / total) });
          }
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });

      v.pause();
      recorder.stop();
      await stopped;
      if (cancelled.current) {
        setJob({ phase: "idle" });
        return;
      }
      const mime = type.split(";")[0];
      const blob = new Blob(chunks, { type: mime });
      setJob({ phase: "done", result: { url: URL.createObjectURL(blob), ext: mime === "video/mp4" ? "mp4" : "webm", size: blob.size, seconds: total } });
    } catch {
      setJob({ phase: "error", message: "The export stopped. Keep this tab open and in front while it records, then try again." });
    } finally {
      v.pause();
      v.removeAttribute("src");
      v.load();
      audio?.close().catch(() => {});
    }
  }

  const length = Math.max(0, end - start);
  const tooLong = length > MAX_SECONDS;
  const preview = frameSize(s.aspect, 720);
  const inClip = cues.filter((c) => c.end > start && c.start < end);
  const working = job.phase === "working";

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      {/* Preview */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            openFile(e.dataTransfer.files[0]);
          }}
          className={cn("relative mx-auto overflow-hidden rounded-md bg-night", s.aspect === "9:16" ? "max-w-[min(22rem,40svh)]" : "max-w-full", dragging && "ring-4 ring-gold")}
          style={{ aspectRatio: `${preview.w} / ${preview.h}` }}
        >
          <canvas ref={canvasRef} width={Math.round(preview.w * 0.6)} height={Math.round(preview.h * 0.6)} className={cn("h-full w-full", !source && "hidden")} aria-label="Clip preview" />
          {!source && (
            <label className="on-night absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center text-starlight">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lamp/15 text-2xl text-lamp" aria-hidden="true">
                ▶
              </span>
              <span className="font-display text-2xl">Drop a video here</span>
              <span className="text-sm text-starlight-dim">or tap to choose one (MP4, MOV or WebM)</span>
              <input type="file" accept="video/*,.mov,.mkv" className="sr-only" onChange={(e) => openFile(e.target.files?.[0])} />
            </label>
          )}
        </div>
        {source && (
          <video
            ref={videoRef}
            src={source.url}
            playsInline
            preload="auto"
            className="pointer-events-none fixed -left-[9999px] h-px w-px opacity-0"
            onLoadedMetadata={onLoaded}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setVideoError("This browser can't play that video. Try the MP4 from YouTube Studio, or open this page in Chrome.")}
          />
        )}
        {videoError && <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-800">{videoError}</p>}

        {source && duration > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <button type="button" onClick={togglePlay} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-ink hover:bg-gold-soft" aria-label={playing ? "Pause" : "Play the clip"}>
                {playing ? "❚❚" : "▶"}
              </button>
              <input type="range" min={0} max={duration} step={0.1} value={current} onChange={(e) => seek(Number(e.target.value))} className="w-full accent-[var(--gold)]" aria-label="Position" />
              <span className="w-24 shrink-0 text-right text-sm tabular-nums text-paper-dim">
                {formatTime(current)} / {formatTime(duration, false)}
              </span>
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-paper-dim">
              <span>{source.name}</span>
              <label className="cursor-pointer text-gold-text hover:underline">
                Change video
                <input type="file" accept="video/*,.mov,.mkv" className="sr-only" onChange={(e) => openFile(e.target.files?.[0])} />
              </label>
              {s.endCard && (
                <button type="button" className="text-gold-text hover:underline" onClick={() => (cardStart.current = performance.now())}>
                  Preview end card
                </button>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {!source && (
          <Step n={1} title="Get the video">
            <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-paper-dim">
              <li>
                Open <span className="text-paper">YouTube Studio → Content</span>, find the service, click <span className="text-paper">⋮ → Download</span>. Or use a recording from your phone.
              </li>
              <li>
                For captions: <span className="text-paper">Subtitles → the language → ⋮ → Download → .srt</span>.
              </li>
              <li>Drop the video into the box. It stays on this computer: nothing is uploaded.</li>
            </ol>
          </Step>
        )}

        {source && duration > 0 && (
          <>
            <Step n={1} title="Trim">
              <div className="grid gap-4 sm:grid-cols-2">
                <TrimControl label="Start" value={start} max={duration} onChange={(t) => setTrim("start", t)} onHere={() => setTrim("start", current)} onGo={() => seek(start)} />
                <TrimControl label="End" value={end} max={duration} onChange={(t) => setTrim("end", t)} onHere={() => setTrim("end", current)} onGo={() => seek(Math.max(start, end - 3))} />
              </div>
              <p className={cn("mt-4 text-sm", tooLong ? "text-red-700" : "text-paper-dim")}>
                Clip length <span className="font-medium tabular-nums text-paper">{formatTime(length, false)}</span>
                {tooLong
                  ? ". That's over 10 minutes: trim it down to export."
                  : s.aspect === "9:16" && length <= SHORT_SECONDS
                    ? ". Fits a YouTube Short (3 minutes or less)."
                    : s.aspect === "9:16"
                      ? ". Over 3 minutes: YouTube will post it as a normal video, not a Short."
                      : "."}
              </p>
            </Step>

            <Step n={2} title="Format">
              <Field label="Shape">
                <Chips
                  value={s.aspect}
                  onChange={(v) => set("aspect", v)}
                  options={[
                    ["9:16", "Vertical 9:16 · Shorts, Reels, Status"],
                    ["1:1", "Square 1:1 · Feed"],
                    ["16:9", "Wide 16:9 · YouTube"],
                  ]}
                />
              </Field>
              <Field label="Picture">
                <Chips
                  value={s.layout}
                  onChange={(v) => set("layout", v)}
                  options={[
                    ["fill", "Fill the frame (crop)"],
                    ["fit", "Whole picture, blurred behind"],
                  ]}
                />
              </Field>
              {s.layout === "fill" && (
                <Field label="Who's in the frame">
                  <Slider min={0} max={1} step={0.01} value={s.focus} onChange={(v) => set("focus", v)} left="Left" right="Right" label="Crop position" />
                </Field>
              )}
              <Field label="Zoom">
                <Slider min={1} max={2} step={0.01} value={s.zoom} onChange={(v) => set("zoom", v)} left="1×" right="2×" label="Zoom" />
              </Field>
              <Field label="Quality">
                <Chips
                  value={String(s.quality) as "1080" | "720"}
                  onChange={(v) => set("quality", Number(v) as 1080 | 720)}
                  options={[
                    ["1080", "1080p · best"],
                    ["720", "720p · smaller file"],
                  ]}
                />
              </Field>
            </Step>

            <Step n={3} title="Captions">
              <div className="rounded-sm border border-gold/50 bg-gold/10 p-4">
                <p className="font-medium text-paper">✨ Auto captions</p>
                <p className="mt-1 text-sm leading-relaxed text-paper-dim">
                  Listens to the clip ({formatTime(length, false)}) and writes the captions for you, on this computer. The first time, it downloads the speech AI once.
                </p>
                {auto.phase === "idle" || auto.phase === "error" ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={autoCaptions}
                      disabled={tooLong}
                      className="inline-flex h-10 items-center rounded-sm bg-night px-5 text-sm font-medium text-starlight hover:bg-night-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                      Write captions for me
                    </button>
                    <Chips value={model} onChange={setModel} options={MODELS.map(([v, l]) => [v, l] as [Model, string])} />
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className={cn("h-full rounded-full bg-gold transition-[width] duration-300", auto.phase === "listening" && "w-full animate-pulse")}
                        style={auto.phase === "listening" ? undefined : { width: `${Math.round(((auto.phase === "audio" ? auto.progress : auto.progress) ?? 0.05) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm text-paper-dim">
                      <span>
                        {auto.phase === "audio" && (auto.progress === null ? "Getting the sound from the clip…" : `Listening through the clip… ${Math.round(auto.progress * 100)}%`)}
                        {auto.phase === "download" && `Downloading the speech AI (first time only)… ${Math.round(auto.progress * 100)}%`}
                        {auto.phase === "listening" && (
                          <span>
                            Writing captions… {formatTime(tick, false)}. A 3-minute clip takes about 1–3 minutes.
                          </span>
                        )}
                      </span>
                      <button type="button" onClick={stopAuto} className="shrink-0 text-red-700 hover:underline">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {auto.phase === "error" && <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-800">{auto.message}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex h-9 cursor-pointer items-center rounded-sm border border-steel px-4 text-sm font-medium text-paper hover:border-gold hover:text-gold-text">
                  Or load .srt / .vtt from YouTube
                  <input type="file" accept=".srt,.vtt,text/vtt" className="sr-only" onChange={(e) => openCaptions(e.target.files?.[0])} />
                </label>
                <button type="button" onClick={addCue} className="inline-flex h-9 items-center rounded-sm border border-steel px-4 text-sm font-medium text-paper hover:border-gold hover:text-gold-text">
                  + Add a caption at {formatTime(Math.max(start, current))}
                </button>
                {cues.length > 0 && (
                  <button type="button" onClick={downloadSrt} className="text-sm text-gold-text hover:underline">
                    Download captions (.srt)
                  </button>
                )}
              </div>
              {captionNote && <p className="mt-2 text-sm text-paper-dim">{captionNote}</p>}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Toggle checked={s.captionsOn} onChange={(v) => set("captionsOn", v)} label="Show captions on the video" />
                <Toggle checked={s.shortPhrases} onChange={(v) => set("shortPhrases", v)} label="Short phrases (3–4 words at a time)" />
              </div>
              <Field label="Style">
                <Chips
                  value={s.captionStyle}
                  onChange={(v) => set("captionStyle", v)}
                  options={[
                    ["outline", "BOLD WHITE"],
                    ["gold", "BOLD GOLD"],
                    ["box", "Text on a dark box"],
                  ]}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Size">
                  <Chips
                    value={s.captionSize}
                    onChange={(v) => set("captionSize", v)}
                    options={[
                      ["s", "Small"],
                      ["m", "Medium"],
                      ["l", "Large"],
                    ]}
                  />
                </Field>
                <Field label="Position">
                  <Chips
                    value={s.captionPos}
                    onChange={(v) => set("captionPos", v)}
                    options={[
                      ["top", "Top"],
                      ["middle", "Middle"],
                      ["bottom", "Bottom"],
                    ]}
                  />
                </Field>
              </div>

              {inClip.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-paper">
                    {inClip.length} caption{inClip.length === 1 ? "" : "s"} in this clip <span className="font-normal text-paper-dim">· fix any word YouTube misheard</span>
                  </p>
                  <ul className="mt-2 max-h-[28rem] divide-y divide-steel/70 overflow-y-auto rounded-sm border border-steel">
                    {inClip.map((c) => (
                      <CueRow key={`${c.id}:${c.start}:${c.end}`} cue={c} active={current >= c.start && current < c.end} onSeek={() => seek(c.start)} onChange={(p) => updateCue(c.id, p)} onRemove={() => removeCue(c.id)} />
                    ))}
                  </ul>
                </div>
              )}
            </Step>

            <Step n={4} title="Branding">
              <Field label="Title at the top (optional)">
                <input
                  value={s.title}
                  onChange={(e) => set("title", e.target.value)}
                  maxLength={80}
                  placeholder="e.g. When God says wait"
                  className="h-10 w-full rounded-sm border border-steel bg-white px-3 text-paper placeholder:text-paper-dim/70 focus:border-gold focus:outline-none"
                />
              </Field>
              <div className="grid gap-3">
                <Toggle checked={s.showLogo} onChange={(v) => set("showLogo", v)} label="City Builders mark in the corner" />
                <Toggle checked={s.showName} onChange={(v) => set("showName", v)} label="Name card for the first 5 seconds" />
                {s.showName && (
                  <input
                    value={s.nameLine}
                    onChange={(e) => set("nameLine", e.target.value)}
                    maxLength={80}
                    aria-label="Name card text"
                    className="h-10 w-full rounded-sm border border-steel bg-white px-3 text-sm text-paper focus:border-gold focus:outline-none"
                  />
                )}
                <Toggle checked={s.endCard} onChange={(v) => set("endCard", v)} label={`End card: service times, ${END_CARD_SECONDS} seconds after the clip`} />
                {s.endCard && (
                  <input
                    value={s.endLine}
                    onChange={(e) => set("endLine", e.target.value)}
                    maxLength={60}
                    aria-label="Web address on the end card"
                    placeholder="Web address or @handle"
                    className="h-10 w-full rounded-sm border border-steel bg-white px-3 text-sm text-paper focus:border-gold focus:outline-none"
                  />
                )}
              </div>
            </Step>

            <Step n={5} title="Export">
              {job.phase === "working" ? (
                <div>
                  <div className="h-3 overflow-hidden rounded-full bg-dusk">
                    <div className="h-full rounded-full bg-gold transition-[width] duration-200" style={{ width: `${Math.round(job.progress * 100)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-paper-dim">
                    <span>Recording… {Math.round(job.progress * 100)}%. Keep this tab open and in front.</span>
                    <button type="button" onClick={() => (cancelled.current = true)} className="text-red-700 hover:underline">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={exportClip}
                    disabled={tooLong || working}
                    className="inline-flex h-11 items-center rounded-sm bg-gold px-6 font-medium text-ink hover:bg-gold-soft disabled:pointer-events-none disabled:opacity-50"
                  >
                    Make the clip ({formatTime(length + (s.endCard ? END_CARD_SECONDS : 0), false)})
                  </button>
                  <p className="mt-2 text-sm text-paper-dim">
                    It records in real time, so a 2-minute clip takes about 2 minutes. {s.quality}p, {s.aspect}.
                  </p>
                </>
              )}
              {job.phase === "error" && <p className="mt-3 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-800">{job.message}</p>}
              {job.phase === "done" && (
                <div className="mt-5 grid items-start gap-4 sm:grid-cols-[12rem_1fr]">
                  <video src={job.result.url} controls playsInline className="w-full rounded-sm bg-black" />
                  <div>
                    <p className="font-medium text-paper">Your clip is ready.</p>
                    <p className="mt-1 text-sm text-paper-dim">
                      {formatTime(job.result.seconds, false)} · {(job.result.size / 1_048_576).toFixed(1)} MB · .{job.result.ext}
                    </p>
                    <a
                      href={job.result.url}
                      download={`${baseName(source.name)}-${s.aspect.replace(":", "x")}.${job.result.ext}`}
                      className="mt-3 inline-flex h-11 items-center rounded-sm bg-gold px-6 font-medium text-ink hover:bg-gold-soft"
                    >
                      Download
                    </a>
                    <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                      Upload it to YouTube (it becomes a Short when it&apos;s vertical and 3 minutes or less), Instagram Reels, TikTok or WhatsApp Status.
                      {job.result.ext === "webm" && " This browser saved it as .webm; YouTube accepts it. For .mp4, use the latest Chrome or Edge."}
                    </p>
                  </div>
                </div>
              )}
            </Step>
          </>
        )}
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-steel bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-3 font-display text-2xl text-paper">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-night font-sans text-sm text-starlight">{n}</span>
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-paper">{label}</p>
      {children}
    </div>
  );
}

function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn("rounded-sm border px-3 py-1.5 text-sm transition-colors", value === v ? "border-night bg-night text-starlight" : "border-steel text-paper hover:border-gold")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-paper">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
      {label}
    </label>
  );
}

function Slider({ min, max, step, value, onChange, left, right, label }: { min: number; max: number; step: number; value: number; onChange: (v: number) => void; left: string; right: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-paper-dim">
      <span>{left}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--gold)]" aria-label={label} />
      <span>{right}</span>
    </div>
  );
}

function TrimControl({ label, value, max, onChange, onHere, onGo }: { label: string; value: number; max: number; onChange: (t: number) => void; onHere: () => void; onGo: () => void }) {
  return (
    <div className="rounded-sm bg-dusk p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-paper">{label}</span>
        <span className="text-sm tabular-nums text-paper">{formatTime(value)}</span>
      </div>
      <input type="range" min={0} max={max} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-[var(--gold)]" aria-label={`${label} of the clip`} />
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <button type="button" onClick={onHere} className="text-gold-text hover:underline">
          Set to now
        </button>
        <button type="button" onClick={() => onChange(value - 0.5)} className="text-paper-dim hover:text-paper" aria-label={`${label} half a second earlier`}>
          −0.5s
        </button>
        <button type="button" onClick={() => onChange(value + 0.5)} className="text-paper-dim hover:text-paper" aria-label={`${label} half a second later`}>
          +0.5s
        </button>
        <button type="button" onClick={onGo} className="text-paper-dim hover:text-paper">
          Watch from here
        </button>
      </div>
    </div>
  );
}

function CueRow({ cue, active, onSeek, onChange, onRemove }: { cue: Cue; active: boolean; onSeek: () => void; onChange: (p: Partial<Cue>) => void; onRemove: () => void }) {
  const [from, setFrom] = useState(formatTime(cue.start));
  const [to, setTo] = useState(formatTime(cue.end));
  const commit = (which: "start" | "end", text: string) => {
    const t = parseTime(text);
    if (t === null) return which === "start" ? setFrom(formatTime(cue.start)) : setTo(formatTime(cue.end));
    if (which === "start" && t < cue.end) onChange({ start: t });
    else if (which === "end" && t > cue.start) onChange({ end: t });
    else if (which === "start") setFrom(formatTime(cue.start));
    else setTo(formatTime(cue.end));
  };
  const timeInput = "h-8 w-[4.5rem] rounded-sm border border-steel bg-white px-1.5 text-center text-xs tabular-nums text-paper focus:border-gold focus:outline-none";
  return (
    <li className={cn("flex flex-col gap-2 p-2 sm:flex-row sm:items-start", active && "bg-gold/10")}>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={onSeek} className="flex h-8 w-8 items-center justify-center rounded-sm text-xs text-paper-dim hover:bg-dusk hover:text-paper" aria-label="Watch this caption">
          ▶
        </button>
        <input value={from} onChange={(e) => setFrom(e.target.value)} onBlur={(e) => commit("start", e.target.value)} className={timeInput} aria-label="Caption starts" />
        <span className="text-xs text-paper-dim">–</span>
        <input value={to} onChange={(e) => setTo(e.target.value)} onBlur={(e) => commit("end", e.target.value)} className={timeInput} aria-label="Caption ends" />
      </div>
      <textarea
        defaultValue={cue.text}
        onBlur={(e) => e.target.value.trim() !== cue.text && onChange({ text: e.target.value.trim() })}
        rows={1}
        className="min-h-8 w-full resize-y rounded-sm border border-steel bg-white px-2 py-1 text-sm text-paper focus:border-gold focus:outline-none"
        aria-label="Caption text"
      />
      <button type="button" onClick={onRemove} className="h-8 shrink-0 px-2 text-xs text-paper-dim hover:text-red-700" aria-label="Delete this caption">
        Delete
      </button>
    </li>
  );
}
