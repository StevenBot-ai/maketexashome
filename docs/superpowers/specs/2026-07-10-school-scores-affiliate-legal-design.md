# MakeTexasHome: School Score Pre-Computation, Affiliate Promo, Legal Pages — Design Spec

**Date:** 2026-07-10

---

## Problem

1. **Results lag:** Every quiz submission triggers 20-40+ sequential Supabase round trips to compute school scores at runtime (paginating 16k+ `school_community_xref` rows, batching school fetches in 200-row chunks). This causes a 3-5 second freeze between quiz submit and shortlist display.

2. **No affiliate monetization:** The quiz and results pages have no sponsored content placement.

3. **No legal pages:** No Terms of Service or Privacy Policy -- required before the app goes live publicly.

---

## Design Decisions

### 1. School Score Pre-Computation

**Decision:** Add a `school_score NUMERIC(5,4)` column to the `communities` table (SEIS pipeline instance, `lvuvbbmyqxxwshcmelrm`). Populate it via a SQL script that computes the min-max normalized average school score per community. Remove all school-related queries from `fetchCommunityMatchData` -- read `school_score` as a plain column instead.

**Scoring formula (canonical, must match year-over-year):**
1. Join `school_community_xref` (where `excluded = false`) to `schools` on `campus_id` and `year`.
2. Use only the most recent year present in `school_community_xref`.
3. For each community: average the `overall_score` of all its linked campuses for that year. Communities with no linked campuses get `NULL`.
4. Min-max normalize the non-null averages across all communities to a 0.0–1.0 range.
5. Write results into `communities.school_score`. Communities with no school data stay `NULL`.

**Annual refresh process:** Re-run the same SQL after new school data is loaded into the `schools` and `school_community_xref` tables. The formula must not change year-over-year without a documented reason -- this is what the skill enforces.

**Skill:** A `compute-school-scores` skill will be written to `~/.claude/skills/compute-school-scores/` documenting the formula, SQL, and how to re-run it annually.

**App changes:**
- Remove paginated `school_community_xref` loop from `fetchCommunityMatchData`
- Remove chunked `schools` fetch loop
- Add `school_score` to the `communities` SELECT in `fetchCommunityMatchData`
- Remove school normalization logic (no longer needed -- value comes pre-normalized from DB)

### 2. Affiliate Promo Block

**Decision:** A single shared `<AffiliatePromo />` component placed at the bottom of the quiz page and the results page. Hardcoded placeholder copy. No DB dependency. Styled to match the app's amber/green palette.

**Component:** `components/shared/affiliate-promo.tsx`

**Placement:**
- `app/quiz/page.tsx` -- below the form submit button
- `app/results/page.tsx` -- below the match cards (and above the "Retake quiz" link)

**Copy (placeholder, swap when real partner exists):**
```
[ Sponsored ]
Planning your move to Texas?
Get a free moving quote and see how easy it can be.
[Get a Free Quote →]   ← href="#TODO"
```

### 3. Legal Pages

**Decision:** Same pattern as `starter-insiders` (built session 55). Two static pages with yellow disclaimer banners. Footer added to landing, quiz, and results pages.

**Files:**
- `app/legal/terms/page.tsx`
- `app/legal/privacy/page.tsx`
- Footer added to `app/page.tsx`, `app/quiz/page.tsx`, `app/results/page.tsx`

**Disclaimer banner (both pages):**
> This page contains placeholder content. Have an attorney review and replace this text before this site goes live.

**Footer copy:**
```
© 2026 MakeTexasHome™  ·  Terms of Service  ·  Privacy Policy
```

---

## What This Does NOT Cover

- Parks, lakes, festivals content pages -- deferred to a future phase.
- Per-card affiliate links -- intentionally excluded (too distracting).
- Pulling affiliate offers from seis-dashboard -- deferred until a real partner exists.
- Google Maps rendering fix -- separate issue, tracked in CLAUDE.local.md.
