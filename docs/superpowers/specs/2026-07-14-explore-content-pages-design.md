# MakeTexasHome: Explore Content Pages (Lakes, Parks, Festivals)

**Date:** 2026-07-14

---

## Problem

MakeTexasHome™ currently serves only one user flow: take the quiz, get a shortlist. This limits the app's utility and its advertising surface area. The SEIS database already contains rich editorial data on 93 lakes/rivers, 192 parks, and 391 festivals -- none of it is surfaced to visitors.

---

## Goals

1. Surface parks, lakes, and festival/fair data to two audiences equally: movers researching Texas lifestyle and current Texas residents exploring what's nearby.
2. Increase affiliate/sponsored content placement by adding three new content pages.
3. Keep the relocation quiz as the primary CTA -- content pages nudge visitors toward the quiz, not away from it.

---

## What This Does NOT Cover

- Community-level aggregation pages (`/explore/[community]`) -- deferred to a future phase.
- Map views or per-card map toggles on content pages -- stays on match cards in results only.
- Pulling affiliate offers from the Texas Apps Hub database -- placeholder `<AffiliatePromo />` only.
- Per-card external links for lakes -- the `lakes` table has no `website_url` column.

---

## Routes

| Route | Content |
|---|---|
| `/lakes` | Browse 93 lakes and rivers, filter by county or vibe |
| `/parks` | Browse 192 parks, filter by type and amenities |
| `/festivals` | Browse 391 festivals and fairs, filter by month or category |

All filters are implemented as URL search params (e.g. `/parks?type=State+Park&camping=true`) so every filtered view is a shareable, indexable URL. Filtering is applied server-side in SQL -- no client-side filtering.

---

## Data

All data is read from the SEIS Supabase instance (`lvuvbbmyqxxwshcmelrm`) via the existing service client. Read-only, anon key never used for these queries (RLS has no anon policies on these tables). Strict one-way data flow: SEIS -> MakeTexasHome only.

### Lakes table columns used

| Column | Display purpose |
|---|---|
| `id` | Key |
| `name` | Card title |
| `alias` | Subtitle |
| `vibe` | Filter tag + badge |
| `county` | Filter + display |
| `city_nearest` | Display |
| `the_lines` | Fish/activities one-liner |
| `fishing_grade` | Badge |
| `rec_access_grade` | Badge |
| `content_hook` | Editorial one-liner (card body) |
| `primary_access` | Access info |
| `managing_agency` | Display |

### Parks table columns used

| Column | Display purpose |
|---|---|
| `id` | Key |
| `name` | Card title |
| `alias` | Subtitle |
| `category` | Filter tag + badge |
| `park_type` | Filter |
| `county` | Display |
| `city_nearest` | Display |
| `acreage` | Display |
| `has_camping` | Filter + badge |
| `water_access` | Filter + badge |
| `fee_required` | Filter + badge |
| `website_url` | External link |
| `managing_agency` | Display |

### Festivals table columns used

| Column | Display purpose |
|---|---|
| `id` | Key |
| `name` | Card title |
| `alias` | Subtitle |
| `category` | Filter tag + badge |
| `city` | Display |
| `month_held` | Filter |
| `recurrence_rule` | Display (e.g. "October") |
| `avg_attendance` | Display |
| `description` | Card body |
| `website_url` | External link (skip if "N/A") |

---

## Data Fetching

Three new files under `lib/explore/`:

**`lib/explore/lakes.ts`**
- Exports `fetchLakes(filters: { county?: string; vibe?: string }): Promise<Lake[]>`
- Queries `lakes` table, applies filters via `.eq()` when present
- Also exports `fetchLakeFilterOptions(): Promise<{ counties: string[]; vibes: string[] }>` for populating filter UI

**`lib/explore/parks.ts`**
- Exports `fetchParks(filters: { type?: string; camping?: boolean; water?: boolean; feeFree?: boolean }): Promise<Park[]>`
- Queries `parks` table with optional `.eq()` filters
- Also exports `fetchParkFilterOptions(): Promise<{ types: string[] }>` for park type filter

**`lib/explore/festivals.ts`**
- Exports `fetchFestivals(filters: { month?: number; category?: string }): Promise<Festival[]>`
- Queries `festivals` table with optional filters, orders by `month_held`
- Category filter uses the first segment of `category` (split on `/`) -- derived from fetched data client-side, no separate query needed

No joins to `comm_relationships` -- these pages display the items directly.

---

## Page Layout (all three pages share this structure)

1. **Logo + nav strip** -- same logo as landing page, links to Lakes / Parks / Festivals / Quiz
2. **Hero header** -- page title + one-sentence description in Nora Winslow's voice
3. **Quiz CTA** -- soft nudge: "Not sure where in Texas you belong? Take the quiz." linking to `/quiz`
4. **Filter bar** -- horizontal pill/tab filters (see per-page details below)
5. **Card grid** -- 1-col on mobile, 2-col on desktop (`grid-cols-1 md:grid-cols-2`)
6. **`<AffiliatePromo />`** -- existing component, same placement as quiz/results pages
7. **Footer** -- same footer as existing pages, including Lakes / Parks / Festivals links

### Filter bar - Lakes (`/lakes`)

- **County** -- dropdown select from distinct `county` values (83 distinct values, too many for pills)
- `vibe` is displayed as a badge on each card but NOT used as a filter (83 distinct values, not useful as a filter dimension)
- Clear filters link when county filter is active

### Filter bar - Parks (`/parks`)

- **Type** -- dropdown select with human-readable labels mapped from `park_type` codes:
  - `SP` = State Park, `NP` = National Park, `NRA` = National Recreation Area, `NF` = National Forest, `NWR` = National Wildlife Refuge, `NHS`/`NHP`/`NM`/`NMEM`/`NS`/`SHS`/`SNA` = Historic/Monument, all others = Other
  - Rendered as: All / State Park / National Park / National Forest / National Recreation Area / Wildlife Refuge / Historic/Monument / Other
- **Amenities** -- checkbox row: Camping / Water Access / Fee-Free
- Clear filters link when any filter is active

### Filter bar - Festivals (`/festivals`)

- **Month** -- pill group: All / Jan / Feb / Mar / Apr / May / Jun / Jul / Aug / Sep / Oct / Nov / Dec (12 values, pills work fine)
- **Category (top-level)** -- dropdown from the first segment of the `category` field (e.g. "Agriculture/Food" -> "Agriculture"). Derived client-side from fetched data. Distinct top-level values: Agriculture, Arts, Community, Cultural, Education, Family, Floral, Food, Heritage, History, Holiday, Literary, Livestock, Music, Nature, Quirky, Rodeo, Shopping, Special Interest, Sports, State Fair (~21 values)
- Clear filters link when any filter is active

---

## Card Designs

### Lakes card

```
[ Vibe badge ]  [ County ]
NAME
Alias

content_hook (editorial one-liner, italicized)

The Lines: the_lines
Access: primary_access
Managed by: managing_agency

Fishing: [fishing_grade badge]  Rec Access: [rec_access_grade badge]
```

### Parks card

```
[ Category badge ]  [ County ]
NAME  (alias)
city_nearest · acreage acres

[ Camping badge if has_camping ]
[ Water Access badge if water_access ]
[ Free badge if not fee_required ]

Managed by: managing_agency
[Visit website →] (if website_url present)
```

### Festivals card

```
[ Category badge ]  [ City ]
NAME  (alias)
recurrence_rule · avg_attendance attendees

description

[Visit website →] (if website_url present and not "N/A")
```

---

## Navigation Updates

### Landing page (`app/page.tsx`)

Add an "Explore Texas" strip between the hero CTA and the footer:

```
[ Lakes ]  [ Parks ]  [ Festivals ]
```

Three text links styled as muted pill links, centered. Labeled "Explore Texas" in small caps above.

### Footer (all pages)

Add Lakes, Parks, Festivals links to the existing footer row alongside Terms / Privacy:

```
© 2026 MakeTexasHome™  ·  Lakes  ·  Parks  ·  Festivals  ·  Terms of Service  ·  Privacy Policy
```

Pages to update: `app/page.tsx`, `app/quiz/page.tsx`, `app/results/page.tsx`, `app/legal/terms/page.tsx`, `app/legal/privacy/page.tsx`.

---

## Affiliate Placement

The existing `<AffiliatePromo />` component is placed at the bottom of each content page, below the card grid and above the footer. No changes to the component itself. This adds three new sponsored content placements to the app.

---

## Voice / Copy

All hero headers and descriptions follow Nora Winslow's voice: warm, unhurried, knowledgeable. No fake urgency, no vague superlatives.

Examples:
- Lakes: "Texas has more than a few good fishing holes. Here's what we know about the lakes and rivers worth your time."
- Parks: "From sprawling state parks to neighborhood greenways, Texas outdoor space is worth knowing before you move -- or just for the weekend."
- Festivals: "Texas takes its festivals seriously. Browse by month or category to see what's happening near where you're considering."

---

## Files to Create

- `lib/explore/lakes.ts`
- `lib/explore/parks.ts`
- `lib/explore/festivals.ts`
- `app/lakes/page.tsx`
- `app/parks/page.tsx`
- `app/festivals/page.tsx`

## Files to Update

- `app/page.tsx` -- add Explore Texas nav strip + updated footer
- `app/quiz/page.tsx` -- updated footer
- `app/results/page.tsx` -- updated footer
- `app/legal/terms/page.tsx` -- updated footer
- `app/legal/privacy/page.tsx` -- updated footer
