import Link from "next/link";
import { MatchCard } from "../../components/results/match-card";
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
        <p className="text-gray-600 mb-6">
          We couldn&apos;t find any communities matching your priorities right
          now. Try adjusting your answers and searching again.
        </p>
        <Link href="/quiz" className="text-green-700 underline">
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
      <Link href="/quiz" className="text-green-700 underline">
        Retake the quiz
      </Link>
    </main>
  );
}
