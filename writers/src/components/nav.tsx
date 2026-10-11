"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "@/content/site";

const links = [
  { href: "#about", label: "About" },
  { href: "#scripts", label: "Scripts" },
  { href: "#team", label: "Team" },
  { href: "#reviews", label: "Reviews" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? "bg-stage/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20">
        <a href="#top" className="font-display text-xl font-extrabold tracking-tight text-white">
          {site.name}
          <span className="text-purple-hot">.</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-white/70 transition hover:text-white">
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-stage transition hover:bg-purple-hot hover:text-white"
          >
            Start a project
          </a>
        </div>
        <button
          type="button"
          className="text-white md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>
      {open && (
        <div className="border-t border-white/10 px-4 pb-6 md:hidden">
          {[...links, { href: "#contact", label: "Start a project" }].map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-3 font-display text-3xl font-bold text-white"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
