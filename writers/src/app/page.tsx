import { ArrowUpRight, Mail, MapPin, Quote, Star } from "lucide-react";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { Reveal } from "@/components/reveal";
import { Counter } from "@/components/counter";
import { Avatar } from "@/components/avatar";
import { ContactForm, ReviewForm } from "@/components/forms";
import { supabase } from "@/lib/supabase";
import {
  founder,
  projects,
  reviews as contentReviews,
  scriptTypes,
  services,
  site,
  stats,
  steps,
  team,
  type Review,
} from "@/content/site";

export const revalidate = 60;

async function getReviews(): Promise<Review[]> {
  if (!supabase) return contentReviews;
  const { data } = await supabase
    .from("reviews")
    .select("name, role, project, quote, rating")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(12);
  return [...((data ?? []) as Review[]), ...contentReviews];
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={`mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] ${
        dark ? "text-blue-hot" : "text-purple"
      }`}
    >
      <span className={`h-px w-10 ${dark ? "bg-blue-hot" : "bg-purple"}`} />
      {children}
    </p>
  );
}

export default async function Home() {
  const allReviews = await getReviews();
  const rated = allReviews.filter((r) => !r.sample);
  const average = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 5;

  return (
    <>
      <Nav />
      <main>
        <Hero />

        {/* ── LOUD BAND ─────────────────────────────────────────── */}
        <section className="relative -mt-px overflow-hidden bg-gradient-to-r from-purple via-[#5b3df0] to-blue py-6 text-white sm:py-8">
          <Marquee
            items={scriptTypes.map((t) => t.title)}
            className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-6xl"
          />
          <Marquee
            items={["Write it loud", "Rewrite it louder", "Deliver on time", "Protect the story"]}
            reverse
            speed="40s"
            className="mt-3 font-serif text-3xl italic text-white/75 sm:text-5xl"
          />
        </section>

        {/* ── ABOUT / WHAT WE DO ────────────────────────────────── */}
        <section id="about" className="scroll-mt-20 bg-page py-24 sm:py-36">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <Eyebrow>What we do</Eyebrow>
              <h2 className="max-w-5xl font-display text-[clamp(2.2rem,6vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
                We&apos;re a room full of writers who turn{" "}
                <span className="font-serif font-normal italic text-electric-ink">big ideas</span> into scripts
                that get <span className="text-electric-ink">made, staged and remembered.</span>
              </h2>
            </Reveal>

            <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
              {stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 0.08} className="bg-page p-6 sm:p-10">
                  <p className="font-display text-5xl font-extrabold tracking-tight text-electric-ink sm:text-7xl">
                    <Counter value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-sm font-medium text-ink-dim sm:text-base">{s.label}</p>
                </Reveal>
              ))}
            </div>

            <div className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((s, i) => (
                <Reveal key={s.title} delay={(i % 3) * 0.08}>
                  <article className="group relative h-full overflow-hidden rounded-3xl border border-line bg-page-2 p-8 transition duration-500 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_30px_80px_-30px_var(--purple)]">
                    <div className="absolute inset-0 -z-0 bg-gradient-to-br from-purple to-blue opacity-0 transition duration-500 group-hover:opacity-100" />
                    <div className="relative">
                      <p className="font-display text-sm font-bold text-purple transition group-hover:text-white/70">
                        {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-6 font-display text-2xl font-bold tracking-tight transition group-hover:text-white sm:text-3xl">
                        {s.title}
                      </h3>
                      <p className="mt-3 leading-relaxed text-ink-dim transition group-hover:text-white/85">{s.body}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOUNDER BIO ───────────────────────────────────────── */}
        <section id="founder" className="relative overflow-hidden bg-page-2 py-24 sm:py-36">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[5fr_7fr] lg:gap-20">
            <Reveal className="relative">
              <div className="absolute -inset-4 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-purple to-blue opacity-90" />
              <Avatar
                name={founder.name}
                photo={founder.photo}
                className="relative aspect-[4/5] w-full rounded-[2rem] shadow-2xl"
              />
              <div className="absolute -bottom-6 left-6 right-6 rounded-2xl bg-stage px-6 py-5 text-white shadow-2xl sm:left-auto sm:right-[-1.5rem] sm:w-auto">
                <p className="font-display text-xl font-bold">{founder.name}</p>
                <p className="text-sm text-blue-hot">{founder.role}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Eyebrow>Meet the founder</Eyebrow>
              <p className="font-serif text-[clamp(2rem,4.2vw,3.6rem)] italic leading-[1.05] text-ink">
                &ldquo;{founder.headline}&rdquo;
              </p>
              <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-dim">
                {founder.bio.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <ul className="mt-8 flex flex-wrap gap-3">
                {founder.highlights.map((h) => (
                  <li key={h} className="rounded-full border border-purple/25 bg-white px-4 py-2 text-sm font-semibold text-purple">
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── SCRIPT TYPES ──────────────────────────────────────── */}
        <section id="scripts" className="grain relative scroll-mt-20 overflow-hidden bg-stage py-24 text-white sm:py-36">
          <div className="pointer-events-none absolute right-[-20%] top-0 h-[50vmax] w-[50vmax] rounded-full bg-purple/30 blur-[140px]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <Eyebrow dark>The scripts we write</Eyebrow>
              <h2 className="font-display text-[clamp(2.6rem,8vw,7.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]">
                Any screen.
                <br />
                Any stage. <span className="font-serif font-normal normal-case italic text-electric">Any ear.</span>
              </h2>
            </Reveal>

            <ul className="mt-16 border-t border-white/10">
              {scriptTypes.map((t, i) => (
                <Reveal key={t.title} delay={0.03 * i}>
                  <li className="group relative overflow-hidden border-b border-white/10">
                    <div className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-purple to-blue transition-transform duration-500 ease-out group-hover:scale-x-100" />
                    <div className="relative grid gap-2 px-2 py-7 sm:grid-cols-[4rem_1fr_auto] sm:items-center sm:gap-8 sm:px-4 sm:py-9">
                      <span className="font-display text-sm font-bold text-blue-hot transition group-hover:text-white/70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{t.title}</h3>
                        <p className="mt-2 max-w-xl text-white/60 transition group-hover:text-white/90">{t.body}</p>
                      </div>
                      <span className="w-fit rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70 group-hover:border-white/60 group-hover:text-white">
                        {t.tag}
                      </span>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── PROCESS ───────────────────────────────────────────── */}
        <section className="bg-page py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <Eyebrow>How it works</Eyebrow>
              <h2 className="font-display text-[clamp(2.2rem,5vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
                From first call to <span className="font-serif font-normal italic text-electric-ink">fade out.</span>
              </h2>
            </Reveal>
            <ol className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {steps.map((s, i) => (
                <Reveal key={s.step} delay={i * 0.1}>
                  <li className="relative border-t-2 border-ink pt-6">
                    <span className="absolute -top-[5px] left-0 h-2 w-2 rounded-full bg-purple" />
                    <p className="font-display text-6xl font-extrabold text-electric-ink">{s.step}</p>
                    <h3 className="mt-4 font-display text-2xl font-bold">{s.title}</h3>
                    <p className="mt-2 leading-relaxed text-ink-dim">{s.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ── TEAM ──────────────────────────────────────────────── */}
        <section id="team" className="scroll-mt-20 bg-page-2 py-24 sm:py-36">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <Reveal>
                <Eyebrow>The room</Eyebrow>
                <h2 className="font-display text-[clamp(2.4rem,7vw,6.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]">
                  Meet the <span className="text-electric-ink">writers.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="max-w-md text-lg text-ink-dim">
                  Every project gets a lead writer and the whole room behind them: different voices, one standard.
                </p>
              </Reveal>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((m, i) => (
                <Reveal key={`${m.name}-${i}`} delay={(i % 3) * 0.08}>
                  <article className="group overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_-40px_var(--ink)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-30px_var(--purple)]">
                    <Avatar
                      name={m.name}
                      photo={m.photo}
                      index={i}
                      className="aspect-[5/4] w-full transition duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="p-7">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple">{m.role}</p>
                      <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">{m.name}</h3>
                      <p className="mt-3 leading-relaxed text-ink-dim">{m.bio}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── WORK + REVIEWS ────────────────────────────────────── */}
        <section id="reviews" className="grain relative scroll-mt-20 overflow-hidden bg-stage py-24 text-white sm:py-36">
          <div className="pointer-events-none absolute -left-[20%] bottom-0 h-[50vmax] w-[50vmax] rounded-full bg-blue/30 blur-[140px]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <Eyebrow dark>Past projects & reviews</Eyebrow>
              <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                <h2 className="font-display text-[clamp(2.4rem,7vw,6.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]">
                  Don&apos;t take
                  <br />
                  <span className="font-serif font-normal normal-case italic text-electric">our word</span> for it.
                </h2>
                {rated.length > 0 && (
                  <div className="flex items-center gap-4">
                    <p className="font-display text-7xl font-extrabold">{average.toFixed(1)}</p>
                    <div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={20} className="fill-blue-hot text-blue-hot" />
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-white/60">
                        from {rated.length} client review{rated.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {projects.map((p, i) => (
                <Reveal key={`${p.title}-${i}`} delay={i * 0.06} className="group bg-stage p-7 transition hover:bg-stage-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-hot">
                    {p.kind} · {p.year}
                  </p>
                  <p className="mt-3 flex items-start justify-between gap-3 font-display text-2xl font-bold">
                    {p.title}
                    <ArrowUpRight className="shrink-0 text-white/30 transition group-hover:text-purple-hot" />
                  </p>
                </Reveal>
              ))}
            </div>

            <div className="mt-8 columns-1 gap-6 md:columns-2 lg:columns-3">
              {allReviews.map((r, i) => (
                <Reveal key={`${r.name}-${i}`} delay={(i % 3) * 0.08} className="mb-6 break-inside-avoid">
                  <figure className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur transition hover:border-purple-hot/50 hover:bg-white/[0.07]">
                    <Quote className="absolute right-6 top-6 text-purple-hot/40" size={40} />
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={16}
                          className={n <= r.rating ? "fill-blue-hot text-blue-hot" : "text-white/20"}
                        />
                      ))}
                    </div>
                    <blockquote className="mt-5 font-serif text-2xl leading-snug text-white/90">
                      &ldquo;{r.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <Avatar name={r.name} index={i} className="h-11 w-11 shrink-0 rounded-full [&_span]:text-base" />
                      <div>
                        <p className="font-bold">
                          {r.name}
                          {r.sample && (
                            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wider text-white/60">
                              Sample
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-white/55">{[r.role, r.project].filter(Boolean).join(" · ")}</p>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>

            <Reveal>
              <details className="group mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-2xl font-bold sm:text-3xl">
                  Worked with us? Leave a review.
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple to-blue text-2xl transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="mt-8">
                  <ReviewForm />
                </div>
              </details>
            </Reveal>
          </div>
        </section>

        {/* ── CONTACT ───────────────────────────────────────────── */}
        <section
          id="contact"
          className="grain relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-stage-3 via-stage to-stage py-24 text-white sm:py-36"
        >
          <div className="animate-float pointer-events-none absolute -right-[10%] -top-[30%] h-[60vmax] w-[60vmax] rounded-full bg-purple/40 blur-[140px]" />
          <div className="relative mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-2">
            <Reveal>
              <Eyebrow dark>Start a project</Eyebrow>
              <h2 className="font-display text-[clamp(2.8rem,6vw,5.5rem)] font-extrabold uppercase leading-[0.88] tracking-[-0.04em]">
                Let&apos;s write
                <br />
                something <span className="text-electric">loud.</span>
              </h2>
              <p className="mt-8 max-w-md text-lg text-white/70">
                Send us the idea, even if it&apos;s just one sentence. We reply to every brief within 48 hours.
              </p>
              <div className="mt-10 space-y-4 text-lg">
                <a href={`mailto:${site.email}`} className="flex items-center gap-3 font-semibold hover:text-blue-hot">
                  <Mail className="text-purple-hot" /> {site.email}
                </a>
                <p className="flex items-center gap-3 text-white/70">
                  <MapPin className="text-purple-hot" /> {site.location}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="self-center">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-10">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="overflow-hidden bg-stage text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-white/10 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="text-white/60">{site.tagline}</p>
          <ul className="flex flex-wrap gap-6">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-white/70 hover:text-purple-hot">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p
          aria-hidden
          style={{ "--stroke": "rgb(168 85 247 / 0.55)" } as React.CSSProperties}
          className="outline-text select-none px-4 pb-4 text-center font-display text-[18.5vw] font-extrabold uppercase leading-[0.8] tracking-[-0.06em]"
        >
          {site.name}
        </p>
        <p className="pb-8 text-center text-sm text-white/40">
          © {new Date().getFullYear()} {site.fullName}. All rights reserved.
        </p>
      </footer>
    </>
  );
}
