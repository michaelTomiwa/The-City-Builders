"use client";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Adire } from "./adire";

const ease = [0.22, 1, 0.36, 1] as const;

/** A repeatable "random" number in [0, 1) for item i, so every piece lands somewhere different. */
const rand = (i: number, n: number) => {
  const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- Opening: two panels of adire cloth part around a gold seal ---------- */

export function Curtain({ monogram }: { monogram: string }) {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    const t1 = setTimeout(() => setOpen(true), 1700);
    const t2 = setTimeout(() => {
      setGone(true);
      document.documentElement.style.overflow = "";
    }, 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (gone) return null;
  const skip = () => {
    setOpen(true);
    setTimeout(() => {
      setGone(true);
      document.documentElement.style.overflow = "";
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 cursor-pointer" onClick={skip} aria-hidden="true">
      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          className="absolute inset-y-0 w-1/2 overflow-hidden bg-[var(--wed-indigo)]"
          style={{ [side]: 0, boxShadow: side === "left" ? "inset -30px 0 60px rgba(0,0,0,.35)" : "inset 30px 0 60px rgba(0,0,0,.35)" }}
          initial={{ x: 0 }}
          animate={{ x: open ? (side === "left" ? "-101%" : "101%") : 0 }}
          transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
        >
          <Adire id={`curtain-${side}`} className="absolute inset-0" opacity={0.35} />
          <div className={`absolute inset-y-0 ${side === "left" ? "right-0" : "left-0"} w-1.5 bg-[var(--wed-gold)]`} />
        </motion.div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -120, opacity: 0 }}
          animate={open ? { scale: 1.6, opacity: 0, rotate: 0 } : { scale: 1, rotate: 0, opacity: 1 }}
          transition={open ? { duration: 0.6, ease } : { type: "spring", stiffness: 120, damping: 12, delay: 0.25 }}
          className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[var(--wed-gold)] text-[var(--wed-deep)] sm:h-44 sm:w-44"
          style={{ boxShadow: "0 0 0 6px rgba(200,162,78,.25), 0 0 80px rgba(200,162,78,.55), inset 0 -8px 20px rgba(0,0,0,.25)" }}
        >
          <motion.span
            className="absolute inset-2 rounded-full border-2 border-dashed border-[var(--wed-deep)]/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <span className="font-wed-display text-4xl italic sm:text-5xl">{monogram}</span>
        </motion.div>
      </div>
      <motion.p
        className="absolute inset-x-0 bottom-10 text-center text-sm text-[var(--wed-mist)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ delay: open ? 0 : 1 }}
      >
        Tap to open
      </motion.p>
    </div>
  );
}

/* ---------- Hero pieces ---------- */

/** A word whose letters rise out of a slot one after another. */
export function SplitWord({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden="true">
          <motion.span
            className="inline-block"
            initial={{ y: "105%", rotate: 12, opacity: 0, filter: "blur(10px)" }}
            animate={{ y: "0%", rotate: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: delay + i * 0.055, ease }}
          >
            {ch}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Ampersand({ delay = 0, className }: { delay?: number; className?: string }) {
  return (
    <motion.span
      className={className}
      initial={{ scale: 0, rotate: -200, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 90, damping: 11, delay }}
      aria-label="and"
    >
      <motion.span className="inline-block" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 1.2 }}>
        &amp;
      </motion.span>
    </motion.span>
  );
}

/** Fades and lifts in after a delay (for the hero's smaller lines). */
export function Enter({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay, ease }}>
      {children}
    </motion.div>
  );
}

/** The hero cloth, drifting slowly and sliding away as you scroll. */
export function DriftingCloth() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  return (
    <motion.div ref={ref} className="absolute inset-0 -z-10 overflow-hidden bg-[var(--wed-indigo)]" style={{ y, scale }}>
      <motion.div
        className="absolute -inset-[160px]"
        animate={{ x: [0, -160], y: [0, -160] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <Adire id="hero" className="absolute inset-0" opacity={0.3} />
      </motion.div>
    </motion.div>
  );
}

/** Gold dust rising through the hero. Positions are fixed so server and browser agree. */
export function GoldDust({ count = 28 }: { count?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 0);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const r = (n: number) => rand(i, n);
        const size = 2 + r(1) * 5;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ left: `${r(2) * 100}%`, bottom: -10, width: size, height: size, background: i % 5 === 0 ? "var(--wed-coral)" : "var(--wed-gold)", boxShadow: "0 0 8px rgba(200,162,78,.8)" }}
            animate={{ y: [0, -900 - r(3) * 400], x: [0, (r(4) - 0.5) * 120], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 9 + r(5) * 9, repeat: Infinity, delay: r(6) * 10, ease: "linear" }}
          />
        );
      })}
    </div>
  );
}

/* ---------- Scroll moments ---------- */

/** A thin gold line along the top that fills as you read down the page. */
export function ScrollThread() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div className="fixed inset-x-0 top-0 z-40 h-1 origin-left bg-gradient-to-r from-[var(--wed-coral)] via-[var(--wed-gold)] to-[var(--wed-coral)]" style={{ scaleX }} />;
}

/** Heading that wipes in from behind a band, letter by letter, when it scrolls into view. */
export function Title({ children, className }: { children: string; className?: string }) {
  const words = children.split(" ");
  let n = 0;
  return (
    <motion.h2 className={className} initial="hidden" whileInView="shown" viewport={{ once: true, margin: "-60px" }} aria-label={children}>
      {words.map((w, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap" aria-hidden="true">
          {[...w].map((ch) => {
            const i = n++;
            return (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className="inline-block"
                  variants={{ hidden: { y: "110%", rotate: 8 }, shown: { y: "0%", rotate: 0, transition: { duration: 0.75, delay: i * 0.03, ease } } }}
                >
                  {ch}
                </motion.span>
              </span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </motion.h2>
  );
}

export function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.9, delay, ease }}>
      {children}
    </motion.div>
  );
}

/** Slides in from one side (the celebrations alternate). */
export function Slide({ children, from, className }: { children: ReactNode; from: "left" | "right"; className?: string }) {
  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, x: from === "left" ? -120 : 120, rotate: from === "left" ? -2 : 2 }}
      whileInView={{ opacity: 1, x: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, ease }}
    >
      {children}
    </motion.li>
  );
}

/** The story's gold thread draws itself as you scroll through it. */
export function Thread({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 25 });
  return (
    <ol ref={ref} className={`relative ${className ?? ""}`}>
      <span className="absolute inset-y-0 left-0 w-px bg-[var(--wed-gold)]/20" aria-hidden="true" />
      <motion.span className="absolute inset-y-0 left-0 w-[3px] -translate-x-px origin-top bg-[var(--wed-gold)]" style={{ scaleY }} aria-hidden="true" />
      {children}
    </ol>
  );
}

export function Bead({ className }: { className?: string }) {
  return (
    <motion.span
      className={className}
      initial={{ scale: 0 }}
      whileInView={{ scale: [0, 1.6, 1] }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.6, ease }}
      style={{ boxShadow: "inset -2px -2px 3px rgba(0,0,0,.3), inset 1px 1px 2px rgba(255,255,255,.35), 0 0 16px rgba(216,67,47,.7)" }}
      aria-hidden="true"
    />
  );
}

/** A colour swatch that unrolls like a bolt of fabric. */
export function Unroll({ children, delay = 0, className, style }: { children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={{ ...style, transformOrigin: "top", transformPerspective: 900 }}
      initial={{ scaleY: 0, rotateX: -70, opacity: 0 }}
      whileInView={{ scaleY: 1, rotateX: 0, opacity: 1 }}
      whileHover={{ y: -10, rotate: -1.5 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1.1, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/** A ribbon of the couple's names and hashtag, always moving. */
export function Ribbon({ items, reverse = false, className }: { items: string[]; reverse?: boolean; className?: string }) {
  const row = [...items, ...items, ...items];
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className ?? ""}`} aria-hidden="true">
      <motion.div className="inline-flex" animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }} transition={{ duration: 28, repeat: Infinity, ease: "linear" }}>
        {[0, 1].map((k) => (
          <span key={k} className="inline-flex items-center">
            {row.map((t, i) => (
              <span key={i} className="inline-flex items-center">
                <span className="px-6">{t}</span>
                <span className="text-[var(--wed-coral)]">●</span>
              </span>
            ))}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------- Celebration ---------- */

/** Gold, coral and white confetti bursting out from the middle of the screen. */
export function Confetti({ fire }: { fire: number }) {
  return (
    <AnimatePresence>
      {fire > 0 && (
        <motion.div key={fire} className="pointer-events-none fixed inset-0 z-50 overflow-hidden" initial={{ opacity: 1 }} exit={{ opacity: 0 }} aria-hidden="true">
          {Array.from({ length: 90 }, (_, i) => {
            const r = (n: number) => rand(i + fire * 1000, n);
            const angle = r(1) * Math.PI * 2;
            const power = 250 + r(2) * 450;
            const colors = ["var(--wed-gold)", "var(--wed-coral)", "#ffffff", "var(--wed-mist)"];
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 block"
                style={{ width: 6 + r(3) * 8, height: 10 + r(4) * 10, background: colors[i % 4], borderRadius: i % 3 === 0 ? 99 : 2 }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * power,
                  y: [0, Math.sin(angle) * power - 200, Math.sin(angle) * power + 500],
                  rotate: r(5) * 1080,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 2.6 + r(6), ease: "easeOut" }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** One countdown number that flips when it changes. */
export function FlipNumber({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`relative inline-flex overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="inline-block"
          initial={{ y: "-100%", opacity: 0, rotateX: 90 }}
          animate={{ y: "0%", opacity: 1, rotateX: 0 }}
          exit={{ y: "100%", opacity: 0, rotateX: -90 }}
          transition={{ duration: 0.45, ease }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Lifts a wish card in when it's added. */
export function Pop({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.li
      layout
      className={className}
      style={style}
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 140, damping: 16 }}
    >
      {children}
    </motion.li>
  );
}
