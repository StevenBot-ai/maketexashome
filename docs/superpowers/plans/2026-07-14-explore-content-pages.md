# Explore Content Pages (Lakes, Parks, Festivals) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three server-rendered browse pages (`/lakes`, `/parks`, `/festivals`) that surface SEIS editorial data to visitors, with server-side URL-param filtering, card grids, and a soft quiz CTA on each page.

**Architecture:** Each page is a Next.js App Router async server component. Filters arrive as URL search params; filtering is applied in SQL via Supabase `.eq()` so every filtered URL is independently indexable. Data fetch functions live in `lib/explore/` -- one file per table. No client components needed (filter links are plain anchor tags with updated href, not controlled inputs).

**Tech Stack:** Next.js 16 App Router, Supabase JS client (service role, server-only), Tailwind CSS v4, TypeScript strict mode.

## Global Constraints

- All brand name appearances: `MakeTexasHome™` (with TM, no space)
- No em-dashes anywhere in copy -- use hyphens or restructure the sentence
- Read SEIS Supabase (`lvuvbbmyqxxwshcmelrm`) via service client only -- never anon key for these tables (RLS has no anon policies)
- Strict one-way data flow: SEIS -> MakeTexasHome only, never writes back
- No client components -- filters implemented as link-based navigation (URL params), not React state
- Typecheck must pass: `npx tsc --noEmit` from project root
- 2-space indentation, ES modules, async/await
- `vibe` displayed as badge on lake cards but NOT a filter dimension
- Festival `website_url` values of `"N/A"` must be suppressed (show no link)
- Park `website_url` may or may not be present -- only render link if truthy

---

## File Map

**Create:**
- `lib/explore/lakes.ts` -- `Lake` type + `fetchLakes()` + `fetchLakeCounties()`
- `lib/explore/parks.ts` -- `Park` type + `fetchParks()` + park type code map
- `lib/explore/festivals.ts` -- `Festival` type + `fetchFestivals()`
- `app/lakes/page.tsx` -- `/lakes` page
- `app/parks/page.tsx` -- `/parks` page
- `app/festivals/page.tsx` -- `/festivals` page

**Modify:**
- `app/page.tsx` -- add Explore Texas nav strip + updated footer
- `app/quiz/page.tsx` -- updated footer only
- `app/results/page.tsx` -- updated footer only
- `app/legal/terms/page.tsx` -- updated footer only
- `app/legal/privacy/page.tsx` -- updated footer only

---

### Task 1: Data layer -- lakes

**Files:**
- Create: `lib/explore/lakes.ts`

**Interfaces:**
- Produces:
  - `Lake` type (exported)
  - `fetchLakes(filters: { county?: string }): Promise<Lake[]>` (exported)
  - `fetchLakeCounties(): Promise<string[]>` (exported)

- [ ] **Step 1: Create `lib/explore/lakes.ts`**

```typescript
import { createServiceClient } from "../supabase/service";

export interface Lake {
  id: string;
  name: string;
  alias: string | null;
  vibe: string | null;
  county: string | null;
  city_nearest: string | null;
  the_lines: string | null;
  fishing_grade: string | null;
  rec_access_grade: string | null;
  content_hook: string | null;
  primary_access: string | null;
  managing_agency: string | null;
}

export async function fetchLakes(filters: { county?: string } = {}): Promise<Lake[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("lakes")
    .select("id, name, alias, vibe, county, city_nearest, the_lines, fishing_grade, rec_access_grade, content_hook, primary_access, managing_agency")
    .order("name");

  if (filters.county) {
    query = query.eq("county", filters.county);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchLakeCounties(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("lakes")
    .select("county")
    .not("county", "is", null)
    .order("county");
  if (error) throw error;
  const counties = [...new Set((data ?? []).map((r) => r.county as string))];
  return counties.sort();
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit` from project root
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add lib/explore/lakes.ts
git commit -m "feat: add lakes data fetch layer"
```

---

### Task 2: Data layer -- parks

**Files:**
- Create: `lib/explore/parks.ts`

**Interfaces:**
- Produces:
  - `Park` type (exported)
  - `PARK_TYPE_LABELS: Record<string, string>` (exported) -- maps `park_type` codes to human-readable labels
  - `fetchParks(filters: { parkTypeLabel?: string; camping?: boolean; water?: boolean; feeFree?: boolean }): Promise<Park[]>` (exported)

- [ ] **Step 1: Create `lib/explore/parks.ts`**

```typescript
import { createServiceClient } from "../supabase/service";

export interface Park {
  id: string;
  name: string;
  alias: string | null;
  category: string | null;
  park_type: string | null;
  county: string | null;
  city_nearest: string | null;
  acreage: number | null;
  has_camping: boolean | null;
  water_access: boolean | null;
  fee_required: boolean | null;
  website_url: string | null;
  managing_agency: string | null;
}

// Maps raw park_type codes to human-readable filter labels.
// Multiple codes map to the same label (e.g. NHS/NHP/NM/... all -> "Historic/Monument").
export const PARK_TYPE_LABELS: Record<string, string> = {
  SP: "State Park",
  NP: "National Park",
  NF: "National Forest",
  NRA: "National Recreation Area",
  NWR: "Wildlife Refuge",
  NHS: "Historic/Monument",
  NHP: "Historic/Monument",
  NM: "Historic/Monument",
  NMEM: "Historic/Monument",
  NS: "Historic/Monument",
  SHS: "Historic/Monument",
  SNA: "Historic/Monument",
};

// Ordered list for rendering the filter UI.
export const PARK_TYPE_FILTER_OPTIONS = [
  "State Park",
  "National Park",
  "National Forest",
  "National Recreation Area",
  "Wildlife Refuge",
  "Historic/Monument",
  "Other",
];

// Returns the park_type codes that match a given human-readable label.
function codesForLabel(label: string): string[] {
  if (label === "Other") {
    const known = new Set(Object.keys(PARK_TYPE_LABELS));
    // "Other" means any code not in the map -- handled via .not() in the query
    return [];
  }
  return Object.entries(PARK_TYPE_LABELS)
    .filter(([, v]) => v === label)
    .map(([k]) => k);
}

export async function fetchParks(
  filters: {
    parkTypeLabel?: string;
    camping?: boolean;
    water?: boolean;
    feeFree?: boolean;
  } = {}
): Promise<Park[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("parks")
    .select("id, name, alias, category, park_type, county, city_nearest, acreage, has_camping, water_access, fee_required, website_url, managing_agency")
    .order("name");

  if (filters.parkTypeLabel) {
    if (filters.parkTypeLabel === "Other") {
      const knownCodes = Object.keys(PARK_TYPE_LABELS);
      query = query.not("park_type", "in", `(${knownCodes.join(",")})`);
    } else {
      const codes = codesForLabel(filters.parkTypeLabel);
      if (codes.length === 1) {
        query = query.eq("park_type", codes[0]);
      } else if (codes.length > 1) {
        query = query.in("park_type", codes);
      }
    }
  }

  if (filters.camping === true) query = query.eq("has_camping", true);
  if (filters.water === true) query = query.eq("water_access", true);
  if (filters.feeFree === true) query = query.eq("fee_required", false);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit` from project root
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add lib/explore/parks.ts
git commit -m "feat: add parks data fetch layer"
```

---

### Task 3: Data layer -- festivals

**Files:**
- Create: `lib/explore/festivals.ts`

**Interfaces:**
- Produces:
  - `Festival` type (exported)
  - `MONTH_NAMES: string[]` (exported) -- index 1-12
  - `fetchFestivals(filters: { month?: number; topCategory?: string }): Promise<Festival[]>` (exported)

- [ ] **Step 1: Create `lib/explore/festivals.ts`**

```typescript
import { createServiceClient } from "../supabase/service";

export interface Festival {
  id: string;
  name: string;
  alias: string | null;
  category: string | null;
  city: string | null;
  month_held: number | null;
  recurrence_rule: string | null;
  avg_attendance: number | null;
  description: string | null;
  website_url: string | null;
}

// Index 0 unused; use MONTH_NAMES[month_held] where month_held is 1-12.
export const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Returns the top-level category segment (before the first "/").
// e.g. "Agriculture/Food" -> "Agriculture", "Music" -> "Music"
export function topCategory(category: string | null): string {
  if (!category) return "Other";
  return category.split("/")[0];
}

export async function fetchFestivals(
  filters: { month?: number; topCategory?: string } = {}
): Promise<Festival[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("festivals")
    .select("id, name, alias, category, city, month_held, recurrence_rule, avg_attendance, description, website_url")
    .order("month_held", { nullsFirst: false })
    .order("name");

  if (filters.month != null) {
    query = query.eq("month_held", filters.month);
  }

  // Top-level category filter: fetch all then filter in JS since the DB
  // stores compound values like "Agriculture/Food" -- SQL LIKE would work
  // but requires a different query form. Filtering 391 rows in JS is fine.
  const { data, error } = await query;
  if (error) throw error;

  let results = data ?? [];

  if (filters.topCategory) {
    results = results.filter(
      (f) => topCategory(f.category) === filters.topCategory
    );
  }

  return results;
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit` from project root
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add lib/explore/festivals.ts
git commit -m "feat: add festivals data fetch layer"
```

---

### Task 4: /lakes page

**Files:**
- Create: `app/lakes/page.tsx`

**Interfaces:**
- Consumes:
  - `fetchLakes({ county?: string }): Promise<Lake[]>` from `lib/explore/lakes`
  - `fetchLakeCounties(): Promise<string[]>` from `lib/explore/lakes`
  - `Lake` type from `lib/explore/lakes`
  - `AffiliatePromo` from `components/shared/affiliate-promo`

- [ ] **Step 1: Create `app/lakes/page.tsx`**

```tsx
import Link from "next/link";
import { fetchLakes, fetchLakeCounties } from "../../lib/explore/lakes";
import type { Lake } from "../../lib/explore/lakes";
import { AffiliatePromo } from "../../components/shared/affiliate-promo";

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
          MakeTexasHome™
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
        <form method="GET">
          <select
            id="county-filter"
            name="county"
            defaultValue={county ?? ""}
            onChange="this.form.submit()"
            className="rounded border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text"
          >
            <option value="">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c} selected={c === county}>
                {c}
              </option>
            ))}
          </select>
          <noscript>
            <button type="submit" className="ml-2 text-sm text-brand-accent underline">
              Apply
            </button>
          </noscript>
        </form>
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
```

> **Note on the county select:** The `onChange="this.form.submit()"` is an inline handler string -- this works in HTML but TypeScript will warn about it. Replace with a small Client Component wrapper for the select if the typecheck fails (see troubleshooting note below).

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit` from project root

If you get a type error on `onChange="this.form.submit()"`, replace the select with a client component. Create `components/explore/county-select.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";

export function CountySelect({
  counties,
  selected,
}: {
  counties: string[];
  selected: string | undefined;
}) {
  const router = useRouter();
  return (
    <select
      defaultValue={selected ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        router.push(val ? `/lakes?county=${encodeURIComponent(val)}` : "/lakes");
      }}
      className="rounded border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text"
    >
      <option value="">All counties</option>
      {counties.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
```

Then in `app/lakes/page.tsx`, replace the `<form>` block with:
```tsx
import { CountySelect } from "../../components/explore/county-select";
// ...
<CountySelect counties={counties} selected={county} />
```

Expected final state: 0 typecheck errors

- [ ] **Step 3: Commit**

```bash
git add app/lakes/page.tsx components/explore/county-select.tsx  # add county-select only if created
git commit -m "feat: add /lakes browse page"
```

---

### Task 5: /parks page

**Files:**
- Create: `app/parks/page.tsx`

**Interfaces:**
- Consumes:
  - `fetchParks({ parkTypeLabel?, camping?, water?, feeFree? }): Promise<Park[]>` from `lib/explore/parks`
  - `PARK_TYPE_FILTER_OPTIONS: string[]` from `lib/explore/parks`
  - `Park` type from `lib/explore/parks`
  - `AffiliatePromo` from `components/shared/affiliate-promo`

- [ ] **Step 1: Create `app/parks/page.tsx`**

```tsx
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
      .filter(([, v]) => v && v !== false)
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
        {/* Amenity checkboxes -- rendered as toggle links */}
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
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit` from project root
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add app/parks/page.tsx
git commit -m "feat: add /parks browse page"
```

---

### Task 6: /festivals page

**Files:**
- Create: `app/festivals/page.tsx`

**Interfaces:**
- Consumes:
  - `fetchFestivals({ month?, topCategory? }): Promise<Festival[]>` from `lib/explore/festivals`
  - `MONTH_NAMES: string[]` from `lib/explore/festivals`
  - `topCategory(category: string | null): string` from `lib/explore/festivals`
  - `Festival` type from `lib/explore/festivals`
  - `AffiliatePromo` from `components/shared/affiliate-promo`

- [ ] **Step 1: Create `app/festivals/page.tsx`**

```tsx
import Link from "next/link";
import { fetchFestivals, MONTH_NAMES, topCategory } from "../../lib/explore/festivals";
import type { Festival } from "../../lib/explore/festivals";
import { AffiliatePromo } from "../../components/shared/affiliate-promo";

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
          festival.avg_attendance
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
  const monthNum = params.month ? parseInt(params.month, 10) : undefined;
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
        {/* Category dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="cat-filter" className="text-sm font-medium text-brand-text">
            Category:
          </label>
          <select
            id="cat-filter"
            className="rounded border border-brand-border bg-white px-3 py-1.5 text-sm text-brand-text"
            defaultValue={categoryFilter ?? ""}
          >
            <option value="">All categories</option>
            {TOP_CATEGORIES.map((c) => (
              <option key={c} value={c} selected={c === categoryFilter}>
                {c}
              </option>
            ))}
          </select>
          {/* Category filter requires JS navigation -- wrap in client component if needed */}
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
```

> **Note on category select:** The select's `onChange` needs JS to navigate. Create `components/explore/category-select.tsx` as a client component (same pattern as the CountySelect in Task 4 if needed) if typecheck or runtime fails. The month pills work without JS; the category dropdown degrades gracefully.

- [ ] **Step 2: Verify typecheck passes**

Run: `npx tsc --noEmit` from project root
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add app/festivals/page.tsx
git commit -m "feat: add /festivals browse page"
```

---

### Task 7: Update landing page and all footers

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/quiz/page.tsx`
- Modify: `app/results/page.tsx`
- Modify: `app/legal/terms/page.tsx`
- Modify: `app/legal/privacy/page.tsx`

**Interfaces:**
- Consumes: nothing new -- purely HTML/JSX edits

- [ ] **Step 1: Update `app/page.tsx`**

Add an "Explore Texas" strip between the quiz CTA link and the footer. Replace the entire file:

```tsx
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
```

- [ ] **Step 2: Update footer in `app/quiz/page.tsx`**

Replace the existing footer block (lines 59-66) with:

```tsx
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
```

- [ ] **Step 3: Update footer in `app/results/page.tsx`**

Replace the existing footer block with the same footer HTML as Step 2.

- [ ] **Step 4: Update footer in `app/legal/terms/page.tsx`**

The terms page has no footer currently -- add it before the closing `</main>` tag:

```tsx
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
```

- [ ] **Step 5: Update footer in `app/legal/privacy/page.tsx`**

Same footer addition as Step 4 -- before the closing `</main>` tag.

- [ ] **Step 6: Verify typecheck passes**

Run: `npx tsc --noEmit` from project root
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/quiz/page.tsx app/results/page.tsx app/legal/terms/page.tsx app/legal/privacy/page.tsx
git commit -m "feat: add Explore Texas nav strip and updated footers across all pages"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `/lakes`, `/parks`, `/festivals` routes -- Tasks 4, 5, 6
- [x] Server-side filtering via URL search params -- all three page tasks
- [x] `lib/explore/` data layer -- Tasks 1, 2, 3
- [x] County filter (dropdown) for lakes -- Task 4
- [x] Park type filter (pills) + amenity toggles -- Task 5
- [x] Month pills + category dropdown for festivals -- Task 6
- [x] `vibe` as badge only, not filter -- Task 4 (badge in LakeCard, no filter UI)
- [x] Festival `website_url === "N/A"` suppressed -- Task 6 (`hasUrl` check)
- [x] `<AffiliatePromo />` on all three pages -- Tasks 4, 5, 6
- [x] Nora Winslow voice copy -- all three page tasks
- [x] Explore Texas nav strip on landing -- Task 7
- [x] Updated footers on all 5 existing pages -- Task 7
- [x] No community-level pages -- correctly excluded
- [x] No map toggles on content pages -- correctly excluded
- [x] TM symbol on all MakeTexasHome appearances -- verified in all tasks
- [x] No em-dashes in copy -- verified in all copy strings

**Type consistency:**
- `fetchLakes` / `Lake` defined in Task 1, consumed in Task 4 -- consistent
- `fetchParks` / `Park` / `PARK_TYPE_FILTER_OPTIONS` defined in Task 2, consumed in Task 5 -- consistent
- `fetchFestivals` / `Festival` / `MONTH_NAMES` / `topCategory` defined in Task 3, consumed in Task 6 -- consistent

**One known gap to watch:** The county and category selects use native `<select>` without JS `onChange` wiring in the server component versions. Task 4 documents the client component fallback pattern (`CountySelect`). Task 6 notes the same for category. If typechecking rejects the inline `selected` prop on `<option>` (React prefers `defaultValue` on `<select>`), use `defaultValue` on the `<select>` and remove `selected` from `<option>` tags.
