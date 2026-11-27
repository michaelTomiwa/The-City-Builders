/*
  Gets the sound of one stretch of a video as 16 kHz mono samples: the form
  Whisper listens to. Small files are decoded in one go (fast); large ones,
  like a full two-hour service, are listened to in real time for just the
  clip, so the browser never has to hold the whole service in memory.
*/

const RATE = 16_000;
const FAST_LIMIT = 400 * 1024 * 1024;

function mono(buffer: AudioBuffer, from: number, to: number) {
  const a = Math.max(0, Math.floor(from * buffer.sampleRate));
  const b = Math.min(buffer.length, Math.ceil(to * buffer.sampleRate));
  const out = new Float32Array(Math.max(0, b - a));
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < out.length; i++) out[i] += data[a + i] / buffer.numberOfChannels;
  }
  return out;
}

async function decodeWhole(file: File, from: number, to: number) {
  const ctx = new OfflineAudioContext(1, RATE, RATE);
  const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  return mono(buffer, from, to);
}

async function listen(url: string, from: number, to: number, onProgress: (p: number) => void, signal: AbortSignal) {
  const video = document.createElement("video");
  video.src = url;
  video.preload = "auto";
  video.playsInline = true;
  const ctx = new AudioContext({ sampleRate: RATE });
  const parts: Float32Array[] = [];
  try {
    if (video.readyState < 1) await new Promise((r) => video.addEventListener("loadedmetadata", r, { once: true }));
    const source = ctx.createMediaElementSource(video);
    const tap = ctx.createScriptProcessor(4096, 1, 1);
    tap.channelCountMode = "explicit";
    tap.channelInterpretation = "speakers";
    const silent = ctx.createGain();
    silent.gain.value = 0;
    tap.onaudioprocess = (e) => {
      if (!video.paused && video.currentTime >= from) parts.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    source.connect(tap);
    tap.connect(silent);
    silent.connect(ctx.destination);
    video.currentTime = from;
    await new Promise((r) => video.addEventListener("seeked", r, { once: true }));
    await ctx.resume();
    await video.play();
    await new Promise<void>((resolve) => {
      const check = () => {
        if (signal.aborted || video.ended || video.currentTime >= to) return resolve();
        onProgress((video.currentTime - from) / (to - from));
        setTimeout(check, 200);
      };
      check();
    });
    video.pause();
  } finally {
    video.removeAttribute("src");
    video.load();
    ctx.close().catch(() => {});
  }
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Float32Array(Math.min(total, Math.ceil((to - from) * RATE)));
  let at = 0;
  for (const p of parts) {
    if (at >= out.length) break;
    out.set(p.subarray(0, out.length - at), at);
    at += p.length;
  }
  return out;
}

/** The clip's sound, plus whether we had to listen in real time. */
export async function clipAudio(file: File, url: string, from: number, to: number, onListen: (p: number) => void, signal: AbortSignal) {
  if (file.size <= FAST_LIMIT) {
    try {
      return await decodeWhole(file, from, to);
    } catch {
      // Some formats only decode through the video element; fall through.
    }
  }
  return listen(url, from, to, onListen, signal);
}

/** Drops Whisper's sound labels such as "[Music]" or "(applause)". */
export function speechOnly(text: string) {
  return text
    .replace(/\[[^\]]*\]|\([^)]*\)|♪+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STEP = 0.05; // seconds per loudness reading

/** How loud the clip is every 50 ms, kept small so the samples can go to the worker. */
export function loudness(audio: Float32Array) {
  const n = Math.round(16_000 * STEP);
  const out = new Float32Array(Math.ceil(audio.length / n));
  for (let i = 0; i < out.length; i++) {
    let sum = 0;
    const end = Math.min(audio.length, (i + 1) * n);
    for (let j = i * n; j < end; j++) sum += audio[j] * audio[j];
    out[i] = Math.sqrt(sum / Math.max(1, end - i * n));
  }
  return out;
}

/**
 * Whisper's times are rough at the edges; move each caption's start forward
 * and its end back to where the voice actually is. Times are seconds from the
 * start of the audio.
 */
export function snapToVoice<T extends { start: number; end: number }>(cues: T[], level: Float32Array): T[] {
  if (!level.length) return cues;
  const sorted = [...level].sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.95)];
  const quiet = loud * 0.12;
  const at = (t: number) => Math.max(0, Math.min(level.length - 1, Math.floor(t / STEP)));
  return cues.map((c) => {
    let a = at(c.start);
    let b = at(c.end);
    while (a < b && level[a] < quiet) a++;
    while (b > a && level[b] < quiet) b--;
    if (b - a < 4) return c; // too little voice to judge; leave it
    return { ...c, start: Math.max(c.start, a * STEP - 0.1), end: Math.min(c.end, (b + 1) * STEP + 0.2) };
  });
}
