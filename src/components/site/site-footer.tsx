import Link from "next/link";
import { LogoMark } from "./logo-mark";

const footerLinks = [
  { href: "/sermons", label: "The watch" },
  { href: "/events", label: "Gatherings" },
  { href: "/tools", label: "Resources" },
  { href: "/prayer", label: "Prayer wall" },
  { href: "/about", label: "About" },
  { href: "/give", label: "Give" },
];

export function SiteFooter() {
  return (
    <footer className="on-night bg-night text-starlight">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <LogoMark className="h-11 w-11 text-lamp" />
            <p className="mt-6 max-w-md font-display text-3xl leading-tight">
              A city whose builder and maker is God.
            </p>
            <p className="mt-2 text-sm text-starlight-dim">Hebrews 11:10</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm text-starlight-dim">Led by</p>
              <p className="mt-1">Pastor Michael Tomiwa</p>
              <p className="mt-6 text-sm text-starlight-dim">Gathering</p>
              <p className="mt-1">In Nigeria and online, worldwide</p>
            </div>
            <div>
              <p className="text-sm text-starlight-dim">Watch with us</p>
              <a
                href="https://www.youtube.com/@thecitybuilderscity"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-lamp underline-offset-4 hover:underline"
              >
                YouTube @thecitybuilderscity
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-night-3 pt-6 text-sm text-starlight-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} The City Builders</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-lamp">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
