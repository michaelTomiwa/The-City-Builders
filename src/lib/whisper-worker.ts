/*
  Auto captions for the Clip Studio. Runs Whisper (free speech-to-text) in a
  background thread in the browser, so the page stays responsive and no audio
  ever leaves the computer. The model downloads once, then the browser keeps it.
*/
import { env, pipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

type Asr = (audio: Float32Array, options: Record<string, unknown>) => Promise<{ text: string; chunks?: { text: string; timestamp: [number, number | null] }[] }>;

let loaded: { model: string; asr: Promise<Asr> } | null = null;

self.onmessage = async (e: MessageEvent<{ audio: Float32Array; model: string }>) => {
  const { audio, model } = e.data;
  try {
    if (!loaded || loaded.model !== model) {
      loaded = {
        model,
        asr: pipeline("automatic-speech-recognition", model, {
          dtype: "q8",
          device: "wasm",
          progress_callback: (p: { status: string; file?: string; loaded?: number; total?: number }) => {
            if (p.status === "progress" && p.file) self.postMessage({ type: "download", file: p.file, loaded: p.loaded ?? 0, total: p.total ?? 0 });
          },
        }) as unknown as Promise<Asr>,
      };
    }
    const asr = await loaded.asr;
    self.postMessage({ type: "listening" });
    const out = await asr(audio, { chunk_length_s: 30, stride_length_s: 5, return_timestamps: true });
    self.postMessage({ type: "done", chunks: out.chunks ?? [] });
  } catch (err) {
    loaded = null;
    self.postMessage({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
