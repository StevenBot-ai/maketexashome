import type { FactorContribution, MatchResult } from "../../lib/matching/types";
import { CommunityMapToggle } from "./community-map-toggle";

const FACTOR_LABELS: Record<string, string> = {
  lakeAccess: "Lake access",
  outdoorAccess: "Outdoor/park access",
  paceOfLife: "Pace of life",
  festivalCulture: "Festival & event culture",
  schoolPriority: "School quality",
  proximity: "Proximity to your chosen community",
};

function formatFactor(
  f: FactorContribution,
  closeToCommunityName: string | null
): string {
  const label = FACTOR_LABELS[f.factor];

  if (f.factor === "proximity") {
    if (f.communityScore === null) return `${label}: no data`;
    const place = closeToCommunityName ?? "your chosen community";
    return `${label}: ${f.communityScore} miles from ${place}`;
  }

  if (f.communityScore === null) return `${label}: No data found`;
  return `${label}: ${Math.round(f.communityScore * 100)}% fit`;
}

export function MatchCard({
  match,
  rank,
  closeToCommunityName,
}: {
  match: MatchResult;
  rank: number;
  closeToCommunityName: string | null;
}) {
  return (
    <div className="border rounded-lg p-6 mb-4">
      <div className="flex justify-between items-baseline">
        <h2 className="text-xl font-bold">
          #{rank} {match.name}
        </h2>
        <span className="text-lg font-semibold text-green-700">
          {Math.round(match.score * 100)}% match
        </span>
      </div>
      {match.tagline && (
        <p className="mt-3 rounded-md bg-amber-50 px-4 py-2 text-center text-lg font-bold text-green-800">
          {match.tagline}
        </p>
      )}
      {match.factorBreakdown.length > 0 && (
        <ul className="text-sm text-gray-500 mt-3 space-y-1">
          {match.factorBreakdown.map((f) => (
            <li key={f.factor}>{formatFactor(f, closeToCommunityName)}</li>
          ))}
        </ul>
      )}
      {match.latitude != null && match.longitude != null && (
        <CommunityMapToggle
          name={match.name}
          latitude={match.latitude}
          longitude={match.longitude}
        />
      )}
      {match.publicationDomain && (
        <a
          href={`https://${match.publicationDomain}`}
          className="mt-3 inline-block text-sm text-green-700 underline"
        >
          {`Subscribe to ${match.name} Shoutouts™`}
        </a>
      )}
    </div>
  );
}
