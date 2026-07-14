import Link from "next/link";
import { fetchLakes, fetchLakeCounties } from "../../lib/explore/lakes";
import type { Lake } from "../../lib/explore/lakes";
import { AffiliatePromo } from "../../components/shared/affiliate-promo";
import { CountySelect } from "../../components/explore/county-select";

function GradeBadge({ label, grade }: { label: string; grade: string | null }) {
  if (!grade) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-brand-muted">{label}:</span>
      <span className="font-semibold text-brand-text">{grade}</span>
    </span>
  );
}

function LakeCard({ lake }: { lake: Lake }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {lake.vibe && (
          <span className="rounded-full bg-brand-cream px-2 py-0.5 text-xs font-medium text-brand-muted">
            {lake.vibe}
          </span>
        )}
        {lake.county && (
          <span className="text-xs text-brand-muted">{lake.county} County</span>
        )}
      </div>
      <h2 className="text-lg font-bold text-brand-text">{lake.name}</h2>
      {lake.alias && (
        <p className="text-sm text-brand-muted">{lake.alias}</p>
      )}
      {lake.content_hook && (
        <p className="mt-3 text-sm italic text-brand-text">{lake.content_hook}</p>
      )}
      {lake.the_lines && (
        <p className="mt-2 text-sm text-brand-muted">
          <span className="font-medium text-brand-text">The lines:</span> {lake.the_lines}
        </p>
      )}
      {lake.primary_access && (
        <p className="mt-1 text-sm text-brand-muted">
          <span className="font-medium text-brand-text">Access:</span> {lake.primary_access}
        </p>
      )}
      {lake.managing_agency && (
        <p className="mt-1 text-sm text-brand-muted">
          <span className="font-medium text-brand-text">Managed by:</span> {lake.managing_agency}
        </p>
      )}
      {(lake.fishing_grade || lake.rec_access_grade) && (
        <div className="mt-3 flex gap-4">
          <GradeBadge label="Fishing" grade={lake.fishing_grade} />
          <GradeBadge label="Rec access" grade={lake.rec_access_grade} />
        </div>
      )}
    </div>
  );
}

export default async function LakesPage({
  searchParams,
}: {
  searchParams: Promise<{ county?: string }>;
}) {
  const { county } = await searchParams;
  const [lakes, counties] = await Promise.all([
    fetchLakes({ county }),
    fetchLakeCounties(),
  ]);

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      {/* Nav */}
      <nav className="flex items-center gap-4 mb-8 text-sm">
        <Link href="/" className="font-bold text-brand-text hover:text-brand-accent">
          MakeTexasHome&#8482;
        </Link>
        <span className="text-brand-muted">|</span>
        <Link href="/lakes" className="text-brand-accent font-semibold">Lakes</Link>
        <Link href="/parks" className="text-brand-muted hover:text-brand-accent">Parks</Link>
        <Link href="/festivals" className="text-brand-muted hover:text-brand-accent">Festivals</Link>
      </nav>

      {/* Hero */}
      <h1 className="text-3xl font-bold text-brand-text mb-2">Texas Lakes and Rivers</h1>
      <p className="text-brand-muted mb-3">
        Texas has more than a few good fishing holes. Here&apos;s what we know about the lakes and rivers worth your time.
      </p>
      <p className="mb-6 text-sm">
        <Link href="/quiz" className="text-brand-accent underline">
          Not sure where in Texas you belong? Take the quiz.
        </Link>
      </p>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label htmlFor="county-filter" className="text-sm font-medium text-brand-text">
          County:
        </label>
        <CountySelect counties={counties} selected={county} />
        {county && (
          <Link href="/lakes" className="text-sm text-brand-accent underline">
            Clear filter
          </Link>
        )}
        <span className="ml-auto text-sm text-brand-muted">{lakes.length} results</span>
      </div>

      {/* Card grid */}
      {lakes.length === 0 ? (
        <p className="text-brand-muted">No lakes found for that filter.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lakes.map((lake) => (
            <LakeCard key={lake.id} lake={lake} />
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
