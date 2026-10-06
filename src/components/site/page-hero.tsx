import type { ReactNode } from "react";
import { NightCity } from "./night-city";
import { Stars } from "./stars";

/** The night-sky banner that opens every inner page, so the whole site shares the hero's world. */
export function PageHero({
  title,
  intro,
  children,
}: {
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="on-night relative overflow-hidden bg-night text-starlight">
      <Stars />
      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-[clamp(6rem,13vw,10rem)] sm:pt-20">
        <h1 className="hero-rise max-w-3xl font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02]">
          {title}
        </h1>
        {intro && (
          <p className="hero-rise mt-5 max-w-xl text-lg leading-relaxed text-starlight-dim [animation-delay:120ms]">
            {intro}
          </p>
        )}
        {children && <div className="hero-rise mt-8 [animation-delay:220ms]">{children}</div>}
      </div>
      <NightCity compact className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(4.5rem,11.8vw,10.5rem)] w-full" />
    </section>
  );
}
