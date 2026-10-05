import Image from "next/image";
import { Skyline } from "@/components/site/skyline";
import { Reveal } from "@/components/site/reveal";

export default function AboutPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-paper-dim">About us</p>
        <h1 className="mt-3 font-display text-4xl text-paper sm:text-5xl">
          A people under construction.
        </h1>

        <div className="mt-10 space-y-6 text-lg leading-relaxed text-paper-dim">
          <p>
            The City Builders is a faith-based ministry dedicated to nurturing
            spiritual growth, deepening alignment with God, and helping believers
            discern and understand divine seasons and times.
          </p>
          <p>
            Here, we teach, equip, and inspire you to build strong spiritual
            foundations, walk in clarity, and mature in your purpose.
          </p>
          <p>
            If you&apos;re seeking direction, deeper insight, and a community
            passionate about God&apos;s move in every season, you&apos;re in the
            right place.
          </p>
        </div>

        <div className="mt-14 border-l-2 border-gold pl-6">
          <p className="font-display text-2xl text-paper">
            &ldquo;A city whose builder and maker is God.&rdquo;
          </p>
          <p className="mt-2 text-sm text-paper-dim">Hebrews 11:10</p>
        </div>

        <div className="mt-16 flex flex-col gap-8 sm:flex-row sm:items-start">
          <Image
            src="/images/pastor-michael-tomiwa.jpg"
            alt="Pastor Michael Tomiwa"
            width={160}
            height={160}
            className="h-32 w-32 shrink-0 rounded-sm object-cover sm:h-40 sm:w-40"
          />
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl text-paper">Pastor Michael Tomiwa</h2>
              <p className="mt-3 text-paper-dim leading-relaxed">
                Pastor Michael leads the City Builders in prayer, teaching, and the
                prophetic — through Night Watch services, Morning Prayers, and
                ongoing word for the season.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl text-paper">Where we gather</h2>
              <p className="mt-3 text-paper-dim leading-relaxed">
                Based in Nigeria, with a community that gathers online from around
                the world — every watch, every week.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Reveal>
        <div className="border-t border-steel/60 bg-dusk/40 py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <Image
              src="/images/about-illustration.jpg"
              alt="A small group gathered together in prayer"
              width={1400}
              height={800}
              className="mx-auto w-full max-w-xl"
            />
            <p className="mt-4 text-sm text-paper-dim">
              We don&apos;t build alone — every watch, every week.
            </p>
          </div>
        </div>
      </Reveal>

      <Skyline className="h-32 w-full opacity-70 sm:h-44" />
    </div>
  );
}
