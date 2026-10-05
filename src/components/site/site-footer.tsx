import Link from "next/link";
import { LogoMark } from "./logo-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-steel/60 bg-dusk/40">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <LogoMark className="h-10 w-10 text-gold" />
        <p className="mt-5 font-display text-2xl text-paper">
          A city whose builder and maker is God.
        </p>
        <p className="mt-1 text-sm text-paper-dim">Hebrews 11:10</p>

        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          <div>
            <p className="text-sm text-paper-dim">Pastor</p>
            <p className="mt-1 text-paper">Michael Tomiwa</p>
          </div>
          <div>
            <p className="text-sm text-paper-dim">Find us</p>
            <p className="mt-1 text-paper">Nigeria — online, every watch</p>
          </div>
          <div>
            <p className="text-sm text-paper-dim">Watch with us</p>
            <a
              href="https://www.youtube.com/@thecitybuilderscity"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-gold-text hover:text-ink"
            >
              YouTube — @thecitybuilderscity
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-steel/60 pt-6 text-xs text-paper-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The City Builders.</p>
          <nav className="flex gap-5">
            <Link href="/about" className="hover:text-gold-text">
              About
            </Link>
            <Link href="/tools" className="hover:text-gold-text">
              Resources
            </Link>
            <Link href="/prayer" className="hover:text-gold-text">
              Prayer wall
            </Link>
            <Link href="/give" className="hover:text-gold-text">
              Give
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
