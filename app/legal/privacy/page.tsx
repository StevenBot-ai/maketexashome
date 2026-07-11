import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 rounded-md bg-yellow-50 border border-yellow-300 px-5 py-4 text-sm text-yellow-800">
        <strong>Placeholder content.</strong> Have an attorney review and replace this text before this site goes live.
      </div>
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-brand-muted mb-4">
        This is placeholder text only. A real privacy policy will be provided before this site goes live.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Information We Collect</h2>
      <p className="text-brand-muted mb-4">
        When you use MakeTexasHome™, we may collect the quiz answers you submit in order to
        generate your community shortlist. We do not currently require account creation or
        store personally identifiable information beyond what is necessary to serve your results.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">How We Use Your Information</h2>
      <p className="text-brand-muted mb-4">
        Quiz answers are used solely to compute your community match results. We do not sell
        your information to third parties.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Cookies and Analytics</h2>
      <p className="text-brand-muted mb-4">
        We may use cookies or analytics tools to understand how visitors use this site.
        Details will be provided in the final version of this policy.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p className="text-brand-muted mb-4">
        Questions about this policy? Contact us at{" "}
        {/* TODO: replace with real contact email */}
        <a href="mailto:hello@maketexashome.com" className="text-brand-accent underline">
          hello@maketexashome.com
        </a>.
      </p>
      <p className="mt-10 text-sm text-brand-muted">Last updated: 2026</p>
      <Link href="/" className="mt-6 inline-block text-brand-accent underline text-sm">
        &larr; Back to home
      </Link>
    </main>
  );
}
