import Link from "next/link";
import { fetchFestivals, MONTH_NAMES, topCategory } from "../../lib/explore/festivals";
import type { Festival } from "../../lib/explore/festivals";
import { AffiliatePromo } from "../../components/shared/affiliate-promo";
import { CategorySelect } from "../../components/explore/category-select";

const TOP_CATEGORIES = [
  "Agriculture", "Arts", "Community", "Cultural", "Education", "Family",
  "Floral", "Food", "Heritage", "History", "Holiday", "Literary",
  "Livestock", "Music", "Nature", "Quirky", "Rodeo", "Shopping",
  "Special Interest", "Sports", "State Fair",
];

function FestivalCard({ festival }: { festival: Festival }) {
  const hasUrl = festival.website_url && festival.website_url !== "N/A";
  return (
    <div className="rounded-lg border border-brand-border bg-white p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {festival.category && (
          <span className="rounded-full bg-brand-cream px-2 py-0.5 text-xs font-medium text-brand-muted">
            {topCategory(festival.category)}
          </span>
        )}
        {festival.city && (
          <span className="text-xs text-brand-muted">{festival.city}</span>
        )}
      </div>
      <h2 className="text-lg font-bold text-brand-text">
        {festival.name}
        {festival.alias && festival.alias !== festival.name && (
          <span className="ml-2 text-sm font-normal text-brand-muted">({festival.alias})</span>
        )}
      </h2>
      <p className="text-sm text-brand-muted mt-0.5">
        {[
          festival.recurrence_rule,
          festival.avg_attendance != null
            ? `${festival.avg_attendance.toLocaleString()} attendees`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {festival.description && (
        <p className="mt-3 text-sm text-brand-text">{festival.description}</p>
      )}
      {hasUrl && (
        <a
          href={festival.website_url!}
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

export default async function FestivalsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; category?: string }>;
}) {
  const params = await searchParams;
  const parsed = params.month ? parseInt(params.month, 10) : NaN;
  const monthNum = Number.isInteger(parsed) ? parsed : undefined;
  const categoryFilter = params.category;

  const festivals = await fetchFestivals({
    month: monthNum,
    topCategory: categoryFilter,
  });

  const hasFilter = monthNum != null || categoryFilter;

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      {/* Nav */}
      <nav className="flex items-center gap-4 mb-8 text-sm">
        <Link href="/" className="font-bold text-brand-text hover:text-brand-accent">
          MakeTexasHome™
        </Link>
        <span className="text-brand-muted">|</span>
        <Link href="/lakes" className="text-brand-muted hover:text-brand-accent">Lakes</Link>
        <Link href="/parks" className="text-brand-muted hover:text-brand-accent">Parks</Link>
        <Link href="/festivals" className="text-brand-accent font-semibold">Festivals</Link>
      </nav>

      {/* Hero */}
      <h1 className="text-3xl font-bold text-brand-text mb-2">Texas Festivals and Fairs</h1>
      <p className="text-brand-muted mb-3">
        Texas takes its festivals seriously. Browse by month or category to see what&apos;s happening near where you&apos;re considering.
      </p>
      <p className="mb-6 text-sm">
        <Link href="/quiz" className="text-brand-accent underline">
          Not sure where in Texas you belong? Take the quiz.
        </Link>
      </p>

      {/* Filter bar */}
      <div className="mb-6 space-y-3">
        {/* Month pills */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={categoryFilter ? `/festivals?category=${encodeURIComponent(categoryFilter)}` : "/festivals"}
            className={`rounded-full px-3 py-1 text-sm ${monthNum == null ? "bg-brand-accent text-white" : "bg-brand-cream text-brand-muted hover:text-brand-text"}`}
          >
            All
          </Link>
          {MONTH_NAMES.slice(1).map((name, i) => {
            const m = i + 1;
            const href = categoryFilter
              ? `/festivals?month=${m}&category=${encodeURIComponent(categoryFilter)}`
              : `/festivals?month=${m}`;
            return (
              <Link
                key={m}
                href={href}
                className={`rounded-full px-3 py-1 text-sm ${monthNum === m ? "bg-brand-accent text-white" : "bg-brand-cream text-brand-muted hover:text-brand-text"}`}
              >
                {name}
              </Link>
            );
          })}
        </div>

        {/* Category dropdown -- client component for JS navigation */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-brand-text">Category:</label>
          <CategorySelect
            categories={TOP_CATEGORIES}
            selected={categoryFilter}
            month={monthNum}
          />
          {hasFilter && (
            <Link href="/festivals" className="text-sm text-brand-accent underline">
              Clear filters
            </Link>
          )}
        </div>

        <p className="text-sm text-brand-muted">{festivals.length} results</p>
      </div>

      {/* Card grid */}
      {festivals.length === 0 ? (
        <p className="text-brand-muted">No festivals found for those filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {festivals.map((f) => (
            <FestivalCard key={f.id} festival={f} />
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
