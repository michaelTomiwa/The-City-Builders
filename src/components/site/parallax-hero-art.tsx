"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export function ParallaxHeroArt() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.8, 0]);

  return (
    <motion.div ref={ref} style={{ y, opacity }} className="pointer-events-none absolute -right-16 -top-10 hidden sm:block">
      <Image
        src="/images/hero-design-export.jpg"
        alt=""
        width={1199}
        height={685}
        priority
        aria-hidden="true"
        className="w-[640px] lg:w-[760px]"
      />
    </motion.div>
  );
}
