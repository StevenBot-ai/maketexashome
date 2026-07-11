import Link from "next/link";
import { MatchCard } from "../../components/results/match-card";
import { AffiliatePromo } from "../../components/shared/affiliate-promo";
import type { MatchResult } from "../../lib/matching/types";

interface ResultsData {
  matches: MatchResult[];
  closeToCommunityName: string | null;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data: dataParam } = await searchParams;
  const { matches, closeToCommunityName }: ResultsData = dataParam
    ? JSON.parse(decodeURIComponent(dataParam))
    : { matches: [], closeToCommunityName: null };

  if (matches.length === 0) {
    return (
      <main className="max-w-xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">No matches found</h1>
        <p className="text-brand-muted mb-6">
          We couldn&apos;t find any communities matching your priorities right
          now. Try adjusting your answers and searching again.
        </p>
        <Link href="/quiz" className="text-brand-accent underline">
          Retake the quiz
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Your real shortlist.</h1>
      {matches.map((m, i) => (
        <MatchCard
          key={m.communityId}
          match={m}
          rank={i + 1}
          closeToCommunityName={closeToCommunityName}
        />
      ))}
      <AffiliatePromo />
      <Link href="/quiz" className="mt-6 inline-block text-brand-accent underline">
        Retake the quiz
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
