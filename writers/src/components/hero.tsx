"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";

const rotating = ["feature films.", "TV series.", "stage plays.", "radio dramas.", "commercials.", "documentaries.", "animation."];

function Typewriter() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = rotating[index];
    const done = !deleting && text === word;
    const empty = deleting && text === "";
    const delay = done ? 1600 : empty ? 250 : deleting ? 35 : 75;
    const t = setTimeout(() => {
      if (done) setDeleting(true);
      else if (empty) {
        setDeleting(false);
        setIndex((i) => (i + 1) % rotating.length);
      } else setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, index]);

  return (
    <span className="font-serif italic text-electric">
      {text}
      <span className="animate-blink ml-0.5 inline-block w-[3px] translate-y-1 bg-blue-hot align-baseline">&nbsp;</span>
    </span>
  );
}

const line = {
  hidden: { y: "110%" },
  show: (i: number) => ({ y: 0, transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] as const } }),
};

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMove}
      className="grain relative isolate flex min-h-[100svh] items-end overflow-hidden bg-stage pb-16 pt-32 text-white sm:pb-24"
    >
      {/* light show */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-lines absolute inset-0" />
        <div className="animate-float absolute -left-[20%] -top-[20%] h-[70vmax] w-[70vmax] rounded-full bg-purple/50 blur-[120px]" />
        <div
          className="animate-float absolute -bottom-[30%] -right-[20%] h-[70vmax] w-[70vmax] rounded-full bg-blue/50 blur-[120px]"
          style={{ animationDelay: "-9s" }}
        />
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              "radial-gradient(600px circle at var(--mx, 50%) var(--my, 40%), rgb(168 85 247 / 0.22), transparent 60%)",
          }}
        />
      </div>

      <motion.div style={{ y, opacity: fade }} className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur"
        >
          <span className="h-2 w-2 rounded-full bg-blue-hot shadow-[0_0_12px_var(--blue-hot)]" />
          {site.fullName}
        </motion.p>

        <h1 className="font-display text-[clamp(3.2rem,12vw,11rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em]">
          {["Scripts", "that refuse", "to be quiet."].map((word, i) => (
            <span key={word} className="block overflow-hidden pb-[0.06em]">
              <motion.span custom={i} variants={line} initial="hidden" animate="show" className="block">
                {i === 1 ? (
                  <>
                    that <span className="outline-text">refuse</span>
                  </>
                ) : i === 2 ? (
                  <span className="text-electric">{word}</span>
                ) : (
                  word
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between"
        >
          <p className="max-w-xl text-xl leading-relaxed text-white/75 sm:text-2xl">
            A collective of writers crafting <Typewriter />
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple to-blue px-7 py-4 text-base font-bold shadow-[0_10px_40px_-10px_var(--purple-hot)] transition hover:scale-[1.03] hover:shadow-[0_10px_60px_-5px_var(--purple-hot)]"
            >
              Commission a script
              <ArrowUpRight className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={20} />
            </a>
            <a
              href="#scripts"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-4 text-base font-bold text-white transition hover:bg-white hover:text-stage"
            >
              See what we write
              <ArrowDownRight size={20} />
            </a>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
