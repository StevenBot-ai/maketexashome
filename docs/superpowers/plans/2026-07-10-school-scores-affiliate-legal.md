# MakeTexasHome: School Scores, Affiliate Promo, Legal Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-compute community school scores in the DB to eliminate quiz lag, add a single affiliate promo block to quiz and results pages, and add legal pages with a site footer.

**Architecture:** School scores are computed once via SQL and stored on `communities.school_score` (SEIS pipeline instance). The app reads them as a plain column -- no runtime computation. The affiliate promo is a shared React component dropped into two pages. Legal pages follow the `starter-insiders` pattern with yellow disclaimer banners.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Supabase (SEIS pipeline instance `lvuvbbmyqxxwshcmelrm` read via anon key)

## Global Constraints

- ES modules only (import/export, never require)
- 2-space indentation
- No new dependencies without approval
- SEIS pipeline instance (`lvuvbbmyqxxwshcmelrm`) is read-only, anon key only -- never service_role writes
- `school_score` column: `NUMERIC(5,4)`, nullable (NULL = no school data for this community)
- Tailwind CSS v4 -- class names follow v4 conventions (no `divide-*` utilities, use border utilities instead)
- Run `npx tsc --noEmit` from the project root after each task to confirm zero type errors
- Brand name in copy: MakeTexasHome™ (with TM symbol)

---

## File Map

**New files:**
- `docs/superpowers/specs/2026-07-10-school-scores-affiliate-legal-design.md` ← already written
- `components/shared/affiliate-promo.tsx` ← shared promo block component
- `app/legal/terms/page.tsx` ← Terms of Service placeholder page
- `app/legal/privacy/page.tsx` ← Privacy Policy placeholder page
- `~/.claude/skills/compute-school-scores/compute-school-scores.md` ← annual recalculation skill

**Modified files:**
- `lib/matching/community-data.ts` ← remove school query loops, read `school_score` from DB
- `app/quiz/page.tsx` ← add `<AffiliatePromo />` and footer
- `app/results/page.tsx` ← add `<AffiliatePromo />` and footer
- `app/page.tsx` ← add footer

---

### Task 1: Add `school_score` column and populate it in Supabase

This task is a manual SQL step -- no app code. Run this SQL in the Supabase SQL editor for the SEIS pipeline instance (`lvuvbbmyqxxwshcmelrm`).

**Files:** None (DB change only)

- [ ] **Step 1: Open Supabase SQL editor**

Go to the Supabase dashboard for project `lvuvbbmyqxxwshcmelrm`. Open the SQL editor.

- [ ] **Step 2: Add the column**

```sql
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS school_score NUMERIC(5,4);
```

Run it. Expected: `ALTER TABLE` with no errors.

- [ ] **Step 3: Compute and populate scores**

```sql
WITH most_recent_year AS (
  SELECT MAX(year) AS year FROM school_community_xref WHERE excluded = false
),
campus_scores AS (
  SELECT
    xref.community_id,
    AVG(s.overall_score) AS avg_score
  FROM school_community_xref xref
  JOIN schools s
    ON s.campus_id = xref.campus_id
    AND s.year = (SELECT year FROM most_recent_year)
  WHERE xref.excluded = false
    AND xref.year = (SELECT year FROM most_recent_year)
    AND s.overall_score IS NOT NULL
  GROUP BY xref.community_id
),
bounds AS (
  SELECT MIN(avg_score) AS min_s, MAX(avg_score) AS max_s FROM campus_scores
),
normalized AS (
  SELECT
    cs.community_id,
    CASE
      WHEN b.max_s = b.min_s THEN 0.5
      ELSE (cs.avg_score - b.min_s) / (b.max_s - b.min_s)
    END AS school_score
  FROM campus_scores cs, bounds b
)
UPDATE communities c
SET school_score = n.school_score
FROM normalized n
WHERE c.id = n.community_id;
```

Run it. Expected: `UPDATE N` where N > 0 (number of communities with school data updated).

- [ ] **Step 4: Verify**

```sql
SELECT id, name, school_score
FROM communities
WHERE geographic_scale = 'C' AND is_live = true
ORDER BY school_score DESC NULLS LAST
LIMIT 20;
```

Expected: rows with `school_score` values between 0.0 and 1.0, some NULLs for communities without school data. Top row should be 1.0000 (highest-scoring community).

- [ ] **Step 5: No commit needed** -- this is a DB change only. Note: no git artifact for this task.

---

### Task 2: Remove school queries from `fetchCommunityMatchData`, read from DB column

**Files:**
- Modify: `lib/matching/community-data.ts`

**Interfaces:**
- Produces: `CommunityMatchData.schoolScore` populated from `communities.school_score` (was computed at runtime, now read from DB)

- [ ] **Step 1: Open `lib/matching/community-data.ts`**

Read the file. Identify the three school-related sections to remove:
1. The paginated `school_community_xref` while-loop (lines ~74-88)
2. The `allSchoolCampusIds` / `schoolScoreMap` / chunked `schools` fetch (lines ~99-120)
3. The `communityToCampuses` map and `rawSchool` computation (lines ~122-154)

- [ ] **Step 2: Replace the communities SELECT to include `school_score`**

Change the communities query from:
```typescript
const { data: communities, error: communitiesError } = await supabase
  .from("communities")
  .select("id, name, tagline, publication_id, geographic_scale, latitude, longitude")
  .eq("geographic_scale", "C")
  .eq("is_live", true);
```

To:
```typescript
const { data: communities, error: communitiesError } = await supabase
  .from("communities")
  .select("id, name, tagline, publication_id, geographic_scale, latitude, longitude, school_score")
  .eq("geographic_scale", "C")
  .eq("is_live", true);
```

- [ ] **Step 3: Remove the three school-data blocks**

Delete these sections entirely from `fetchCommunityMatchData`:

```typescript
// DELETE: paginated xref fetch
const allXrefRows: { community_id: string; campus_id: string; year: number }[] = [];
const PAGE_SIZE = 1000;
let xrefOffset = 0;
while (true) {
  const { data: page, error: xrefError } = await supabase
    .from("school_community_xref")
    ...
  // (entire while loop)
}

// DELETE: mostRecentSchoolYear + thisYearXref + allSchoolCampusIds
const mostRecentSchoolYear = ...
const thisYearXref = ...
const allSchoolCampusIds = ...

// DELETE: schoolScoreMap + chunked fetch loop
const schoolScoreMap = new Map<string, number>();
const IN_CHUNK_SIZE = 200;
for (let i = 0; i < allSchoolCampusIds.length; i += IN_CHUNK_SIZE) {
  ...
}

// DELETE: communityToCampuses map
const communityToCampuses = new Map<string, string[]>();
for (const row of thisYearXref) {
  ...
}

// DELETE: rawSchool computation block
const rawSchool: Record<string, number | null> = {};
for (const c of communities ?? []) rawSchool[c.id] = null;
for (const c of communities ?? []) {
  const campuses = communityToCampuses.get(c.id) ?? [];
  ...
}

// DELETE: schoolNormalized block
const idsWithSchoolData = ...
const schoolNormalized: Record<string, number | null> = {};
if (idsWithSchoolData.length > 0) {
  ...
}
for (const c of communities ?? []) {
  if (!(c.id in schoolNormalized)) schoolNormalized[c.id] = null;
}
```

- [ ] **Step 4: Update the return map to read `school_score` from the DB row**

Change the return statement's `schoolScore` line from:
```typescript
schoolScore: schoolNormalized[c.id] ?? null,
```

To:
```typescript
schoolScore: c.school_score ?? null,
```

- [ ] **Step 5: Also remove the TEMP DIAGNOSTIC log in `app/actions.ts`**

In `app/actions.ts`, delete these two lines:
```typescript
// TEMP DIAGNOSTIC -- remove after confirming school scores
const schoolSample = communities.slice(0, 5).map(c => `${c.id}:${c.schoolScore}`);
console.log("[DIAG] school scores sample:", schoolSample.join(", "));
```

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If TypeScript complains about `school_score` not existing on the communities type, it's because Supabase's generated types don't know about the new column yet -- cast with `(c as any).school_score` as a temporary fix, or regenerate types if the CLI is set up.

- [ ] **Step 7: Commit**

```bash
git add lib/matching/community-data.ts app/actions.ts
git commit -m "perf: read school_score from DB column, remove runtime school query chain"
```

---

### Task 3: Write the `compute-school-scores` skill

This documents the annual recalculation process so it's repeatable every year.

**Files:**
- Create: `C:\Users\Dell-E5530\.claude\skills\compute-school-scores\compute-school-scores.md`

- [ ] **Step 1: Create the skill directory and file**

```bash
mkdir -p "C:\Users\Dell-E5530\.claude\skills\compute-school-scores"
```

- [ ] **Step 2: Write the skill**

Create `C:\Users\Dell-E5530\.claude\skills\compute-school-scores\compute-school-scores.md`:

```markdown
---
name: compute-school-scores
description: Use when annual school data has been updated in the SEIS pipeline instance and community school_score values need to be recomputed.
---

# Compute School Scores

Recomputes and stores community-level school quality scores in the `communities` table
of the SEIS pipeline Supabase instance (`lvuvbbmyqxxwshcmelrm`).

## When to Run

Run once per year after new school data is loaded into the `schools` and
`school_community_xref` tables. Do NOT change the formula between runs without
documenting the reason -- consistent year-over-year scoring is the point.

## Formula (canonical)

1. Join `school_community_xref` (excluded = false, most recent year only) to `schools`
   on `campus_id` + `year`.
2. Average `overall_score` across all linked campuses per community.
3. Communities with no linked campuses: `school_score = NULL`.
4. Min-max normalize non-null averages to 0.0–1.0 across all communities.
5. Write into `communities.school_score`.

## SQL to Run

Open the SQL editor in the Supabase dashboard for `lvuvbbmyqxxwshcmelrm` and run:

```sql
WITH most_recent_year AS (
  SELECT MAX(year) AS year FROM school_community_xref WHERE excluded = false
),
campus_scores AS (
  SELECT
    xref.community_id,
    AVG(s.overall_score) AS avg_score
  FROM school_community_xref xref
  JOIN schools s
    ON s.campus_id = xref.campus_id
    AND s.year = (SELECT year FROM most_recent_year)
  WHERE xref.excluded = false
    AND xref.year = (SELECT year FROM most_recent_year)
    AND s.overall_score IS NOT NULL
  GROUP BY xref.community_id
),
bounds AS (
  SELECT MIN(avg_score) AS min_s, MAX(avg_score) AS max_s FROM campus_scores
),
normalized AS (
  SELECT
    cs.community_id,
    CASE
      WHEN b.max_s = b.min_s THEN 0.5
      ELSE (cs.avg_score - b.min_s) / (b.max_s - b.min_s)
    END AS school_score
  FROM campus_scores cs, bounds b
)
UPDATE communities c
SET school_score = n.school_score
FROM normalized n
WHERE c.id = n.community_id;
```

## Verify After Running

```sql
SELECT id, name, school_score
FROM communities
WHERE geographic_scale = 'C' AND is_live = true
ORDER BY school_score DESC NULLS LAST
LIMIT 20;
```

Expected: top row = 1.0000, values between 0 and 1, some NULLs for communities with
no school data. If all values are 0.5, the min = max case triggered -- check that
`schools.overall_score` is populated for the most recent year.

## If the Formula Changes

Document the reason and the date in a comment at the top of this skill before running.
That record is how future sessions know whether a year-over-year score shift is
intentional or a bug.
```

- [ ] **Step 3: No commit needed** -- skill files live in `~/.claude/skills/`, not in the repo.

---

### Task 4: Affiliate promo component

**Files:**
- Create: `components/shared/affiliate-promo.tsx`

**Interfaces:**
- Produces: `<AffiliatePromo />` -- zero props, self-contained

- [ ] **Step 1: Create the component**

Create `components/shared/affiliate-promo.tsx`:

```tsx
export function AffiliatePromo() {
  return (
    <div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-6 py-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
        Sponsored
      </p>
      <p className="text-lg font-bold text-stone-800 mb-1">
        Planning your move to Texas?
      </p>
      <p className="text-sm text-stone-600 mb-4">
        Get a free moving quote and see how easy it can be.
      </p>
      {/* TODO: replace href with real affiliate URL before go-live */}
      <a
        href="#TODO"
        className="inline-block rounded-full bg-green-700 px-6 py-2 text-sm font-semibold text-white hover:bg-green-800"
      >
        Get a Free Quote &rarr;
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/shared/affiliate-promo.tsx
git commit -m "feat: add AffiliatePromo placeholder component"
```

---

### Task 5: Add affiliate promo and footer to quiz and results pages

**Files:**
- Modify: `app/quiz/page.tsx`
- Modify: `app/results/page.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `<AffiliatePromo />` from `components/shared/affiliate-promo.tsx`

- [ ] **Step 1: Update `app/quiz/page.tsx`**

Add the import at the top:
```tsx
import { AffiliatePromo } from "../../components/shared/affiliate-promo";
```

Add `<AffiliatePromo />` after the closing `</form>` tag and before the closing `</main>`:
```tsx
      </form>
      <AffiliatePromo />
      <footer className="mt-10 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        <p>
          &copy; 2026 MakeTexasHome&trade;&nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/terms" className="underline hover:text-stone-600">Terms of Service</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/privacy" className="underline hover:text-stone-600">Privacy Policy</a>
        </p>
      </footer>
    </main>
```

- [ ] **Step 2: Update `app/results/page.tsx`**

Add the import at the top:
```tsx
import { AffiliatePromo } from "../../components/shared/affiliate-promo";
```

In the main results return (after the match cards map, before the "Retake quiz" link):
```tsx
      {matches.map((m, i) => (
        <MatchCard
          key={m.communityId}
          match={m}
          rank={i + 1}
          closeToCommunityName={closeToCommunityName}
        />
      ))}
      <AffiliatePromo />
      <Link href="/quiz" className="mt-6 inline-block text-green-700 underline">
        Retake the quiz
      </Link>
      <footer className="mt-10 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        <p>
          &copy; 2026 MakeTexasHome&trade;&nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/terms" className="underline hover:text-stone-600">Terms of Service</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/privacy" className="underline hover:text-stone-600">Privacy Policy</a>
        </p>
      </footer>
    </main>
```

- [ ] **Step 3: Update `app/page.tsx` (landing page footer only)**

Add a footer before the closing `</main>` in the landing page:
```tsx
      <footer className="mt-10 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
        <p>
          &copy; 2026 MakeTexasHome&trade;&nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/terms" className="underline hover:text-stone-600">Terms of Service</a>
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          <a href="/legal/privacy" className="underline hover:text-stone-600">Privacy Policy</a>
        </p>
      </footer>
    </main>
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app/quiz/page.tsx app/results/page.tsx app/page.tsx
git commit -m "feat: add affiliate promo block and footer to quiz, results, and landing pages"
```

---

### Task 6: Legal pages

**Files:**
- Create: `app/legal/terms/page.tsx`
- Create: `app/legal/privacy/page.tsx`

- [ ] **Step 1: Create `app/legal/terms/page.tsx`**

```tsx
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 rounded-md bg-yellow-50 border border-yellow-300 px-5 py-4 text-sm text-yellow-800">
        <strong>Placeholder content.</strong> Have an attorney review and replace this text before this site goes live.
      </div>
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-stone-600 mb-4">
        By using MakeTexasHome™ you agree to these terms. This is placeholder text only.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Use of the Service</h2>
      <p className="text-stone-600 mb-4">
        MakeTexasHome™ provides community matching information for informational purposes only.
        It is not a real estate, legal, or financial advisory service. Results are generated
        from publicly available data and proprietary community scoring -- they do not constitute
        a recommendation to buy, sell, or lease property.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Limitation of Liability</h2>
      <p className="text-stone-600 mb-4">
        To the fullest extent permitted by law, MakeTexasHome™ and its operators are not liable
        for any damages arising from your use of this service or reliance on its results.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Changes to These Terms</h2>
      <p className="text-stone-600 mb-4">
        We may update these terms at any time. Continued use of the service constitutes
        acceptance of the updated terms.
      </p>
      <p className="mt-10 text-sm text-stone-400">Last updated: 2026</p>
      <Link href="/" className="mt-6 inline-block text-green-700 underline text-sm">
        &larr; Back to home
      </Link>
    </main>
  );
}
```

- [ ] **Step 2: Create `app/legal/privacy/page.tsx`**

```tsx
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 rounded-md bg-yellow-50 border border-yellow-300 px-5 py-4 text-sm text-yellow-800">
        <strong>Placeholder content.</strong> Have an attorney review and replace this text before this site goes live.
      </div>
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-stone-600 mb-4">
        This is placeholder text only. A real privacy policy will be provided before this site goes live.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Information We Collect</h2>
      <p className="text-stone-600 mb-4">
        When you use MakeTexasHome™, we may collect the quiz answers you submit in order to
        generate your community shortlist. We do not currently require account creation or
        store personally identifiable information beyond what is necessary to serve your results.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">How We Use Your Information</h2>
      <p className="text-stone-600 mb-4">
        Quiz answers are used solely to compute your community match results. We do not sell
        your information to third parties.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Cookies and Analytics</h2>
      <p className="text-stone-600 mb-4">
        We may use cookies or analytics tools to understand how visitors use this site.
        Details will be provided in the final version of this policy.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p className="text-stone-600 mb-4">
        Questions about this policy? Contact us at{" "}
        {/* TODO: replace with real contact email */}
        <a href="mailto:hello@maketexashome.com" className="text-green-700 underline">
          hello@maketexashome.com
        </a>.
      </p>
      <p className="mt-10 text-sm text-stone-400">Last updated: 2026</p>
      <Link href="/" className="mt-6 inline-block text-green-700 underline text-sm">
        &larr; Back to home
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/legal/terms/page.tsx app/legal/privacy/page.tsx
git commit -m "feat: add legal pages (terms and privacy) with placeholder disclaimer banners"
```

---

### Task 7: Final verification

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify quiz page**

Navigate to `http://localhost:3000/quiz`. Confirm:
- AffiliatePromo block is visible below the form button
- Footer with Terms / Privacy links is visible
- Quiz submits and results appear noticeably faster than before (school queries eliminated)

- [ ] **Step 3: Verify results page**

Submit the quiz. On the results page confirm:
- Match cards appear
- AffiliatePromo block appears below the cards
- Footer is visible
- "Get a Free Quote" button is present (href="#TODO" is fine)

- [ ] **Step 4: Verify legal pages**

Navigate to `http://localhost:3000/legal/terms` and `http://localhost:3000/legal/privacy`. Confirm:
- Yellow disclaimer banner is visible on both
- Content renders without errors
- "Back to home" link works

- [ ] **Step 5: Verify landing page footer**

Navigate to `http://localhost:3000`. Confirm footer with Terms / Privacy links is visible.

- [ ] **Step 6: Final typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Push**

```bash
git push
```

---

### Task 8: Brand token system (CSS variables + class swap)

Add a `@theme` block to `globals.css` with MakeTexasHome's current green/amber/stone palette as named CSS custom properties, then replace the core hardcoded color classes across all pages and components with `brand-*` tokens. Result: swap 7 values in `globals.css` to recolor the entire app, same as `starter-insiders`.

**Files:**
- Modify: `app/globals.css`
- Modify: `app/page.tsx`
- Modify: `app/quiz/page.tsx`
- Modify: `app/results/page.tsx`
- Modify: `components/results/match-card.tsx`
- Modify: `components/results/community-map-toggle.tsx`
- Modify: `components/shared/affiliate-promo.tsx`

**Interfaces:**
- Produces: 7 CSS custom properties available as Tailwind utility classes via `bg-brand-*`, `text-brand-*`, `border-brand-*`

- [ ] **Step 1: Add `@theme` block to `app/globals.css`**

Replace the entire contents of `app/globals.css` with:

```css
@import "tailwindcss";

@theme {
  /* Brand palette — replace all values to recolor the entire app */
  --color-brand-cream:        #FFFBF5;  /* page background */
  --color-brand-surface:      #FFFFFF;  /* card/panel background */
  --color-brand-border:       #E5E7EB;  /* borders and dividers */
  --color-brand-text:         #1C2B1A;  /* primary text */
  --color-brand-muted:        #6B7280;  /* secondary/muted text */
  --color-brand-accent:       #15803D;  /* buttons, links, highlights (green-700) */
  --color-brand-accent-hover: #166534;  /* accent hover state (green-800) */
  --font-sans: Arial, Helvetica, sans-serif;
}

body {
  background-color: var(--color-brand-cream);
  color: var(--color-brand-text);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Update `app/page.tsx`**

Replace hardcoded color classes:

```tsx
// BEFORE
<main className="flex min-h-screen flex-col items-center justify-start bg-amber-50 px-6 pt-10 pb-16 text-center">
  ...
  <h1 className="max-w-lg text-4xl font-bold text-stone-800">
  ...
  <p className="mt-4 max-w-md text-lg text-stone-600">
  ...
  className="mt-8 rounded-full bg-green-700 px-8 py-3 text-lg font-semibold text-white hover:bg-green-800"
```

```tsx
// AFTER
<main className="flex min-h-screen flex-col items-center justify-start bg-brand-cream px-6 pt-10 pb-16 text-center">
  ...
  <h1 className="max-w-lg text-4xl font-bold text-brand-text">
  ...
  <p className="mt-4 max-w-md text-lg text-brand-muted">
  ...
  className="mt-8 rounded-full bg-brand-accent px-8 py-3 text-lg font-semibold text-white hover:bg-brand-accent-hover"
```

Also update the footer added in Task 5:
```tsx
// BEFORE
<footer className="mt-10 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
// AFTER
<footer className="mt-10 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
```

- [ ] **Step 3: Update `app/quiz/page.tsx`**

```tsx
// BEFORE
<h1 className="text-3xl font-bold mb-2">
<p className="text-gray-600 mb-8">
className="w-full bg-green-700 text-white rounded p-3 font-semibold"
<footer className="mt-10 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">

// AFTER
<h1 className="text-3xl font-bold mb-2 text-brand-text">
<p className="text-brand-muted mb-8">
className="w-full bg-brand-accent text-white rounded p-3 font-semibold hover:bg-brand-accent-hover"
<footer className="mt-10 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
```

- [ ] **Step 4: Update `app/results/page.tsx`**

```tsx
// BEFORE
<Link href="/quiz" className="text-green-700 underline">   (both instances)
<footer className="mt-10 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">

// AFTER
<Link href="/quiz" className="text-brand-accent underline">   (both instances)
<footer className="mt-10 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
```

- [ ] **Step 5: Update `components/results/match-card.tsx`**

```tsx
// BEFORE
<span className="text-lg font-semibold text-green-700">
<p className="mt-3 rounded-md bg-amber-50 px-4 py-2 text-center text-lg font-bold text-green-800">
className="mt-3 inline-block text-sm text-green-700 underline"

// AFTER
<span className="text-lg font-semibold text-brand-accent">
<p className="mt-3 rounded-md bg-brand-cream px-4 py-2 text-center text-lg font-bold text-brand-accent">
className="mt-3 inline-block text-sm text-brand-accent underline"
```

- [ ] **Step 6: Update `components/results/community-map-toggle.tsx`**

```tsx
// BEFORE
className="text-sm text-green-700 underline"

// AFTER
className="text-sm text-brand-accent underline"
```

- [ ] **Step 7: Update `components/shared/affiliate-promo.tsx`**

```tsx
// BEFORE
<div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-6 py-5 text-center">
<p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
<p className="text-lg font-bold text-stone-800 mb-1">
<p className="text-sm text-stone-600 mb-4">
className="inline-block rounded-full bg-green-700 px-6 py-2 text-sm font-semibold text-white hover:bg-green-800"

// AFTER
<div className="mt-10 rounded-lg border border-brand-border bg-brand-cream px-6 py-5 text-center">
<p className="text-xs font-semibold uppercase tracking-wide text-brand-muted mb-1">
<p className="text-lg font-bold text-brand-text mb-1">
<p className="text-sm text-brand-muted mb-4">
className="inline-block rounded-full bg-brand-accent px-6 py-2 text-sm font-semibold text-white hover:bg-brand-accent-hover"
```

- [ ] **Step 8: Typecheck**

```bash
npx tsc --noEmit
```

Expected: 0 errors. (CSS changes don't affect TypeScript.)

- [ ] **Step 9: Verify visually**

Run `npm run dev` and check `http://localhost:3000`. The app should look identical to before (same green/amber/stone palette, just driven by variables). To confirm the system works, temporarily change `--color-brand-accent` in `globals.css` to `#DC2626` (red) -- every button and link should turn red. Revert after confirming.

- [ ] **Step 10: Commit**

```bash
git add app/globals.css app/page.tsx app/quiz/page.tsx app/results/page.tsx components/results/match-card.tsx components/results/community-map-toggle.tsx components/shared/affiliate-promo.tsx
git commit -m "feat: add brand token system to globals.css, replace hardcoded color classes"
```

- [ ] **Step 11: Push**

```bash
git push
```
