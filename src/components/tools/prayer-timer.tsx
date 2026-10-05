"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const presets = [5, 15, 30, 60];

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function PrayerTimer() {
  const [minutes, setMinutes] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function selectPreset(m: number) {
    setMinutes(m);
    setSecondsLeft(m * 60);
    setRunning(false);
    setDone(false);
  }

  function toggle() {
    if (done) {
      setSecondsLeft(minutes * 60);
      setDone(false);
      setRunning(true);
      return;
    }
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setDone(false);
    setSecondsLeft(minutes * 60);
  }

  const progress = 1 - secondsLeft / (minutes * 60);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => selectPreset(p)}
            className={`rounded-sm border px-3 py-1 text-sm transition-colors ${
              minutes === p
                ? "border-gold text-gold-text"
                : "border-steel text-paper-dim hover:text-paper"
            }`}
          >
            {p} min
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-6">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--steel)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-lg text-paper">
            {formatClock(secondsLeft)}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-paper-dim">
            {done
              ? "Time's up — well watched."
              : running
                ? "Standing watch…"
                : "Ready when you are."}
          </p>
          <div className="flex gap-3">
            <Button size="sm" onClick={toggle}>
              {done ? "Pray again" : running ? "Pause" : "Start"}
            </Button>
            <Button size="sm" variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
