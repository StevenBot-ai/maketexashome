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
      <footer className="mt-10 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
        <p>
          &copy; 2026 MakeTexasHome&trade;&nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/terms" className="underline hover:text-brand-text">Terms of Service</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/privacy" className="underline hover:text-brand-text">Privacy Policy</a>
        </p>
      </footer>
    </main>
  );
}
