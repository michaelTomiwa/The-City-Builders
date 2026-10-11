import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-stage px-4 text-center text-white">
      <p className="font-display text-[30vw] font-extrabold leading-none tracking-tighter text-electric sm:text-[18rem]">404</p>
      <p className="mt-4 font-serif text-3xl italic text-white/80">This scene was cut in the edit.</p>
      <Link
        href="/"
        className="mt-10 rounded-full bg-gradient-to-r from-purple to-blue px-8 py-4 font-bold transition hover:scale-105"
      >
        Back to the top
      </Link>
    </main>
  );
}
