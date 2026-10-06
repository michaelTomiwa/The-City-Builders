"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cb-fast-tracker";
const durations = [3, 7, 21, 40];

type FastState = {
  lengthDays: number;
  startedAt: string;
  completedDays: number[];
} | null;

export function FastingTracker() {
  const [fast, setFast] = useState<FastState>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setFast(JSON.parse(raw));
      } catch {
        // ignore
      }
      setLoaded(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      if (fast) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fast));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [fast, loaded]);

  function start(lengthDays: number) {
    setFast({ lengthDays, startedAt: new Date().toISOString(), completedDays: [] });
  }

  function toggleDay(day: number) {
    if (!fast) return;
    setFast({
      ...fast,
      completedDays: fast.completedDays.includes(day)
        ? fast.completedDays.filter((d) => d !== day)
        : [...fast.completedDays, day],
    });
  }

  if (!fast) {
    return (
      <div>
        <p className="text-paper-dim">Start a fast and track each day you keep it.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => start(d)}
              className="rounded-sm border border-steel px-4 py-2 text-sm text-paper-dim transition-colors hover:border-gold hover:text-gold-text"
            >
              {d}-day fast
            </button>
          ))}
        </div>
      </div>
    );
  }

  const doneCount = fast.completedDays.length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-paper-dim">
          Day {doneCount} of {fast.lengthDays}
        </p>
        <Button size="sm" variant="ghost" onClick={() => setFast(null)}>
          End fast
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: fast.lengthDays }, (_, i) => i + 1).map((day) => {
          const isDone = fast.completedDays.includes(day);
          return (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`flex h-9 w-9 items-center justify-center rounded-sm border text-sm transition-colors ${
                isDone
                  ? "border-gold bg-gold text-ink"
                  : "border-steel text-paper-dim hover:border-gold"
              }`}
              aria-pressed={isDone}
              aria-label={`Day ${day}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
