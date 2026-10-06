/*
  The sky over the site follows the real time in Lagos (WAT, UTC+1).

  applySky() runs twice: once as an inline script before the first paint
  (so there's no flash of the wrong sky), and then every minute from
  <SkyClock />. It must stay self-contained — it is serialised with
  toString() — so no imports or outer variables inside it.

  For previews, ?sky=day|dawn|dusk|night or ?lagos=13:30 overrides the clock.
*/
export function applySky() {
  const params = new URLSearchParams(window.location.search);
  const now = new Date();
  let minutes = ((now.getUTCHours() + 1) % 24) * 60 + now.getUTCMinutes();
  const forced = params.get("lagos");
  if (forced && /^\d{1,2}:\d{2}$/.test(forced)) {
    const parts = forced.split(":");
    minutes = Number(parts[0]) * 60 + Number(parts[1]);
  }

  // dawn 5:30–7:00, day 7:00–17:45, dusk 17:45–19:30, night otherwise
  let phase =
    minutes < 330 || minutes >= 1170 ? "night" : minutes < 420 ? "dawn" : minutes < 1065 ? "day" : "dusk";
  const forcedPhase = params.get("sky");
  if (forcedPhase === "night" || forcedPhase === "dawn" || forcedPhase === "day" || forcedPhase === "dusk") {
    phase = forcedPhase;
    if (!forced) minutes = { night: 60, dawn: 395, day: 760, dusk: 1110 }[forcedPhase];
  }

  // sun rises ~6:15 and sets ~18:45 in Lagos all year; the moon takes the other half
  const rise = 375;
  const set = 1125;
  function clamp(p: number) {
    return Math.min(Math.max(p, 0), 1);
  }
  function arc(p: number) {
    return { x: 6 + p * 88, y: 78 - Math.sin(Math.PI * p) * 70 };
  }
  const sun = arc(clamp((minutes - rise) / (set - rise)));
  const moon = arc(clamp(((minutes - set + 1440) % 1440) / (1440 - (set - rise))));

  const root = document.documentElement;
  root.dataset.sky = phase;
  root.style.setProperty("--sun-x", sun.x + "%");
  root.style.setProperty("--sun-y", sun.y + "%");
  root.style.setProperty("--moon-x", moon.x + "%");
  root.style.setProperty("--moon-y", moon.y + "%");
}

export const skyScript = `(${applySky.toString()})()`;
