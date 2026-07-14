import Link from "next/link";
import { fetchParks, PARK_TYPE_FILTER_OPTIONS } from "../../lib/explore/parks";
import type { Park } from "../../lib/explore/parks";
import { AffiliatePromo } from "../../components/shared/affiliate-promo";

function AmenityBadge({ label, show }: { label: string; show: boolean | null }) {
  if (!show) return null;
  return (
    <span className="rounded-full bg-brand-cream px-2 py-0.5 text-xs font-medium text-brand-text">
      {label}
    </span>
  );
}

function ParkCard({ park }: { park: Park }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {park.category && (
          <span className="rounded-full bg-brand-cream px-2 py-0.5 text-xs font-medium text-brand-muted">
            {park.category}
          </span>
        )}
        {park.county && (
          <span className="text-xs text-brand-muted">{park.county} County</span>
        )}
      </div>
      <h2 className="text-lg font-bold text-brand-text">
        {park.name}
        {park.alias && park.alias !== park.name && (
          <span className="ml-2 text-sm font-normal text-brand-muted">({park.alias})</span>
        )}
      </h2>
      {park.city_nearest && (
        <p className="text-sm text-brand-muted mt-0.5">
          {park.city_nearest}
          {park.acreage ? ` · ${park.acreage.toLocaleString()} acres` : ""}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        <AmenityBadge label="Camping" show={park.has_camping} />
        <AmenityBadge label="Water Access" show={park.water_access} />
        <AmenityBadge label="Free" show={park.fee_required === false} />
      </div>
      {park.managing_agency && (
        <p className="mt-3 text-sm text-brand-muted">
          <span className="font-medium text-brand-text">Managed by:</span> {park.managing_agency}
        </p>
      )}
      {park.website_url && (
        <a
          href={park.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-brand-accent underline"
        >
          Visit website &rarr;
        </a>
      )}
    </div>
  );
}

function amenityParam(searchParams: Record<string, string | undefined>, key: string): boolean {
  return searchParams[key] === "true";
}

export default async function ParksPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; camping?: string; water?: string; feeFree?: string }>;
}) {
  const params = await searchParams;
  const typeLabel = params.type;
  const camping = amenityParam(params, "camping");
  const water = amenityParam(params, "water");
  const feeFree = amenityParam(params, "feeFree");

  const parks = await fetchParks({ parkTypeLabel: typeLabel, camping, water, feeFree });

  const hasFilter = typeLabel || camping || water || feeFree;

  function filterHref(overrides: Record<string, string | boolean | undefined>): string {
    const merged = { type: typeLabel, camping, water, feeFree, ...overrides };
    const qs = Object.entries(merged)
      .filter(([, v]) => Boolean(v))
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join("&");
    return qs ? `/parks?${qs}` : "/parks";
  }

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      {/* Nav */}
      <nav className="flex items-center gap-4 mb-8 text-sm">
        <Link href="/" className="font-bold text-brand-text hover:text-brand-accent">
          MakeTexasHome™
        </Link>
        <span className="text-brand-muted">|</span>
        <Link href="/lakes" className="text-brand-muted hover:text-brand-accent">Lakes</Link>
        <Link href="/parks" className="text-brand-accent font-semibold">Parks</Link>
        <Link href="/festivals" className="text-brand-muted hover:text-brand-accent">Festivals</Link>
      </nav>

      {/* Hero */}
      <h1 className="text-3xl font-bold text-brand-text mb-2">Texas Parks and Outdoor Spaces</h1>
      <p className="text-brand-muted mb-3">
        From sprawling state parks to neighborhood greenways, Texas outdoor space is worth knowing before you move -- or just for the weekend.
      </p>
      <p className="mb-6 text-sm">
        <Link href="/quiz" className="text-brand-accent underline">
          Not sure where in Texas you belong? Take the quiz.
        </Link>
      </p>

      {/* Filter bar */}
      <div className="mb-6 space-y-3">
        {/* Type filter -- pills */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterHref({ type: undefined })}
            className={`rounded-full px-3 py-1 text-sm ${!typeLabel ? "bg-brand-accent text-white" : "bg-brand-cream text-brand-muted hover:text-brand-text"}`}
          >
            All
          </Link>
          {PARK_TYPE_FILTER_OPTIONS.map((opt) => (
            <Link
              key={opt}
              href={filterHref({ type: opt })}
              className={`rounded-full px-3 py-1 text-sm ${typeLabel === opt ? "bg-brand-accent text-white" : "bg-brand-cream text-brand-muted hover:text-brand-text"}`}
            >
              {opt}
            </Link>
          ))}
        </div>
        {/* Amenity filters -- rendered as toggle links */}
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={filterHref({ camping: !camping || undefined })}
            className={`rounded border px-3 py-1 ${camping ? "border-brand-accent text-brand-accent" : "border-brand-border text-brand-muted hover:text-brand-text"}`}
          >
            {camping ? "- " : "+ "}Camping
          </Link>
          <Link
            href={filterHref({ water: !water || undefined })}
            className={`rounded border px-3 py-1 ${water ? "border-brand-accent text-brand-accent" : "border-brand-border text-brand-muted hover:text-brand-text"}`}
          >
            {water ? "- " : "+ "}Water Access
          </Link>
          <Link
            href={filterHref({ feeFree: !feeFree || undefined })}
            className={`rounded border px-3 py-1 ${feeFree ? "border-brand-accent text-brand-accent" : "border-brand-border text-brand-muted hover:text-brand-text"}`}
          >
            {feeFree ? "- " : "+ "}Fee-Free
          </Link>
          {hasFilter && (
            <Link href="/parks" className="text-brand-accent underline">
              Clear filters
            </Link>
          )}
        </div>
        <p className="text-sm text-brand-muted">{parks.length} results</p>
      </div>

      {/* Card grid */}
      {parks.length === 0 ? (
        <p className="text-brand-muted">No parks found for those filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parks.map((park) => (
            <ParkCard key={park.id} park={park} />
          ))}
        </div>
      )}

      <AffiliatePromo />

      {/* Footer */}
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
