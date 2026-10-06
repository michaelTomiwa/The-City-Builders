"use client";

import { useEffect, useState } from "react";

const plan = [
  { day: "Monday", reading: "Psalm 127" },
  { day: "Tuesday", reading: "Ecclesiastes 3" },
  { day: "Wednesday", reading: "Hebrews 11:1-16" },
  { day: "Thursday", reading: "Matthew 7:24-27" },
  { day: "Friday", reading: "Habakkuk 2" },
  { day: "Saturday", reading: "Psalm 91" },
  { day: "Sunday", reading: "Isaiah 60:1-5" },
];

const STORAGE_KEY = "cb-reading-plan";

export function ReadingPlan() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) setChecked(JSON.parse(raw));
      } catch {
        // ignore unavailable storage
      }
      setLoaded(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      // ignore unavailable storage
    }
  }, [checked, loaded]);

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <p className="text-sm text-paper-dim">
        {doneCount} of {plan.length} days read this week
      </p>
      <ul className="mt-4 divide-y divide-steel/60">
        {plan.map((item) => (
          <li key={item.day} className="flex items-center justify-between py-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={!!checked[item.day]}
                onChange={(e) =>
                  setChecked((c) => ({ ...c, [item.day]: e.target.checked }))
                }
                className="h-4 w-4 accent-gold"
              />
              <span className="text-paper-dim">{item.day}</span>
            </label>
            <span
              className={
                checked[item.day] ? "text-paper line-through" : "text-paper"
              }
            >
              {item.reading}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
