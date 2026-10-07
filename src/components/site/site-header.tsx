"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand-logo";
import { LiveBadge } from "./live-badge";
import { ScrollProgress } from "./scroll-progress";

const baseLinks = [
  { href: "/sermons", label: "The watch" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Gatherings" },
  { href: "/tools", label: "Resources" },
  { href: "/prayer", label: "Prayer wall" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  extraLinks = [],
  logoUrl,
}: {
  extraLinks?: { href: string; label: string }[];
  logoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const links = [...baseLinks, ...extraLinks];

  return (
    <header className="on-night sticky top-0 z-40 border-b border-night-3/70 bg-night/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <BrandLogo src={logoUrl} className="h-9 w-9 text-lamp transition-transform duration-500 group-hover:-translate-y-0.5" />
            <span className="font-display text-xl text-starlight">
              City Builders
            </span>
          </Link>
          <span className="hidden sm:block">
            <LiveBadge />
          </span>
        </div>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-starlight-dim transition-colors hover:text-lamp"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/give"
            className="rounded-sm bg-gold px-5 py-2 text-sm font-medium text-ink transition-colors hover:bg-gold-soft"
          >
            Give
          </Link>
        </nav>

        <button
          className="flex h-9 w-9 items-center justify-center text-starlight lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <span className="relative block h-4 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 h-px w-5 bg-starlight transition-transform",
                open && "translate-y-2 rotate-45"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-2 h-px w-5 bg-starlight transition-opacity",
                open && "opacity-0"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-4 h-px w-5 bg-starlight transition-transform",
                open && "-translate-y-2 -rotate-45"
              )}
            />
          </span>
        </button>
      </div>
      <ScrollProgress />

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-1 overflow-hidden border-t border-night-3/70 px-6 lg:hidden"
          >
            <div className="flex flex-col gap-1 pb-6 pt-2">
              <div className="py-2 sm:hidden">
                <LiveBadge />
              </div>
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={link.href}
                    className="block py-2 text-starlight-dim hover:text-lamp"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                href="/give"
                className="mt-2 rounded-sm bg-gold px-5 py-2 text-center text-sm font-medium text-ink"
                onClick={() => setOpen(false)}
              >
                Give
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
