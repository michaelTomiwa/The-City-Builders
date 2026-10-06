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

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 0.85, scale: 1 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute -right-20 -top-12 hidden sm:block"
    >
      <Image
        src="/images/hero-design-export.jpg"
        alt=""
        width={1199}
        height={685}
        priority
        aria-hidden="true"
        className="w-[720px] lg:w-[920px]"
      />
    </motion.div>
  );
}
