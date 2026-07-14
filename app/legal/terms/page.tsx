import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 rounded-md bg-yellow-50 border border-yellow-300 px-5 py-4 text-sm text-yellow-800">
        <strong>Placeholder content.</strong> Have an attorney review and replace this text before this site goes live.
      </div>
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-brand-muted mb-4">
        By using MakeTexasHome™ you agree to these terms. This is placeholder text only.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Use of the Service</h2>
      <p className="text-brand-muted mb-4">
        MakeTexasHome™ provides community matching information for informational purposes only.
        It is not a real estate, legal, or financial advisory service. Results are generated
        from publicly available data and proprietary community scoring -- they do not constitute
        a recommendation to buy, sell, or lease property.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Limitation of Liability</h2>
      <p className="text-brand-muted mb-4">
        To the fullest extent permitted by law, MakeTexasHome™ and its operators are not liable
        for any damages arising from your use of this service or reliance on its results.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Changes to These Terms</h2>
      <p className="text-brand-muted mb-4">
        We may update these terms at any time. Continued use of the service constitutes
        acceptance of the updated terms.
      </p>
      <p className="mt-10 text-sm text-brand-muted">Last updated: 2026</p>
      <Link href="/" className="mt-6 inline-block text-brand-accent underline text-sm">
        &larr; Back to home
      </Link>
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
