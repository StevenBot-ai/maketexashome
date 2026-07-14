import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-brand-cream px-6 pt-10 pb-16 text-center">
      <Image
        src="/logo.png"
        alt="MakeTexasHome"
        width={480}
        height={320}
        priority
        className="w-full max-w-[220px] h-auto mb-4"
      />
      <h1 className="max-w-lg text-4xl font-bold text-brand-text">
        Let&apos;s figure out what you&apos;re actually looking for.
      </h1>
      <p className="mt-4 max-w-md text-lg text-brand-muted">
        Tell us about lakes, pace of life, schools, and more. MakeTexasHome&trade; matches your answers against real Texas community data.
        Consider us, no pressure.
      </p>
      <Link
        href="/quiz"
        className="mt-8 rounded-full bg-brand-accent px-8 py-3 text-lg font-semibold text-white hover:bg-brand-accent-hover"
      >
        Get my shortlist
      </Link>

      {/* Explore Texas strip */}
      <div className="mt-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-3">
          Explore Texas
        </p>
        <div className="flex gap-4">
          <Link
            href="/lakes"
            className="rounded-full border border-brand-border px-5 py-2 text-sm text-brand-muted hover:text-brand-text hover:border-brand-text"
          >
            Lakes
          </Link>
          <Link
            href="/parks"
            className="rounded-full border border-brand-border px-5 py-2 text-sm text-brand-muted hover:text-brand-text hover:border-brand-text"
          >
            Parks
          </Link>
          <Link
            href="/festivals"
            className="rounded-full border border-brand-border px-5 py-2 text-sm text-brand-muted hover:text-brand-text hover:border-brand-text"
          >
            Festivals
          </Link>
        </div>
      </div>

      <footer className="mt-10 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
        <p>
          &copy; 2026 MakeTexasHome&trade;&nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/lakes" className="underline hover:text-brand-text">Lakes</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/parks" className="underline hover:text-brand-text">Parks</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/festivals" className="underline hover:text-brand-text">Festivals</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/terms" className="underline hover:text-brand-text">Terms of Service</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/privacy" className="underline hover:text-brand-text">Privacy Policy</a>
        </p>
      </footer>
    </main>
  );
}
