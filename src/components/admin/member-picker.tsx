"use client";

import { useState } from "react";

export type PickerMember = { id: string; name: string; email: string | null };

/** Choose which members a programme or assignment is for. */
export function MemberPicker({
  members,
  selected,
  onChange,
}: {
  members: PickerMember[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const set = new Set(selected);
  const shown = members.filter((m) => `${m.name} ${m.email ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  function toggle(id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <div className="mt-3 rounded-sm border border-steel bg-white">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${members.length} members`}
        className="h-9 w-full border-b border-steel bg-transparent px-3 text-sm text-paper outline-none"
      />
      <ul className="max-h-56 overflow-y-auto py-1">
        {shown.length === 0 && <li className="px-3 py-2 text-sm text-paper-dim">No one matches.</li>}
        {shown.map((m) => (
          <li key={m.id}>
            <label className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-dusk/60">
              <input type="checkbox" checked={set.has(m.id)} onChange={() => toggle(m.id)} className="accent-gold" />
              <span className="min-w-0">
                <span className="block truncate text-paper">{m.name}</span>
                {m.email && <span className="block truncate text-xs text-paper-dim">{m.email}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-steel px-3 py-2 text-xs text-paper-dim">
        <span>{selected.length} chosen</span>
        <span className="flex gap-3">
          <button type="button" onClick={() => onChange(members.map((m) => m.id))} className="hover:text-gold-text">
            All
          </button>
          <button type="button" onClick={() => onChange([])} className="hover:text-gold-text">
            None
          </button>
        </span>
      </div>
    </div>
  );
}
