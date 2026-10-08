"use client";

import { useState } from "react";

/** Pick who a task is for: the whole team, or chosen people. */
export function TaskAssignees({ people }: { people: { id: string; name: string }[] }) {
  const [all, setAll] = useState(true);
  const [chosen, setChosen] = useState<string[]>([]);
  return (
    <div>
      <input type="hidden" name="assignees" value={JSON.stringify(all ? [] : chosen)} />
      <div className="grid grid-cols-2 gap-1 rounded bg-dusk p-1 text-sm">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" onClick={() => setAll(v)} className={all === v ? "rounded bg-white py-1.5 text-paper shadow-sm" : "rounded py-1.5 text-paper-dim"}>
            {v ? "Whole team" : "Chosen people"}
          </button>
        ))}
      </div>
      {!all && (
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-sm border border-steel bg-white py-1">
          {people.map((p) => (
            <li key={p.id}>
              <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-paper hover:bg-dusk/50">
                <input
                  type="checkbox"
                  checked={chosen.includes(p.id)}
                  onChange={(e) => setChosen((c) => (e.target.checked ? [...c, p.id] : c.filter((x) => x !== p.id)))}
                  className="accent-gold"
                />
                {p.name}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
