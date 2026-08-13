# Acadia Base Camp

One-weekend trip site for a 12-person camping trip — Blackwoods Campground, Acadia National Park, Aug 14–16, 2026. Mobile-first; built to be opened on a phone at a picnic table.

**Itinerary** — three day plans with live NWS weather, the camp card, and the crew · **Chirp** — the trip's feed: photos, hearts, threads, @mentions, polls · **Packing** — claimable group gear + a private per-person checklist · **Food** — a menu you vote on and a shopping list it generates · **Expenses** — who paid, split to the cent · **Explore** — trails, town, and every logistics link verified.

## Stack

Next.js (App Router) + TypeScript + Tailwind on Vercel. Supabase for Postgres, anonymous auth, Realtime and Storage — no accounts, no passwords. One Supabase Edge Function (`weather`) proxies api.weather.gov (Open-Meteo fallback) into a 2-hour cache.

- `app/`, `components/` — UI
- `lib/data/` — the data layer; `NEXT_PUBLIC_DATA_MODE=mock` runs the whole UI on in-memory seed data with no backend at all
- `lib/` — pure logic that's unit-tested away from React: `settle.ts` (money), `chirp.ts` (feed text), `outbox.ts` (offline writes), `aisle.ts` (shopping), `survey.ts`
- `supabase/migrations/` — schema, RLS, seeds, and every content edit
- `supabase/functions/weather/` — forecast proxy (Deno)

---

# The backend

## Start here: a `profile` is a device, a `member` is a person

This is the one idea that explains the rest of the schema, and nearly every bug this app has had came from confusing the two.

There are no accounts. A phone calls `signInAnonymously()`, gets a uuid, and that uuid is a row in **`profiles`**. But iOS gives Safari and a Home-Screen install *separate storage*, so adding the app to your home screen mints a **second** anonymous user for the same human. In practice most people here have two profiles; one has four.

So the people on the trip are their own table, **`members`** — twelve rows that exist whether or not anyone has opened the app — and a profile points at the member it belongs to. The data layer exposes three helpers built on that link:

```
memberOf(userId)  →  which person a device belongs to
isMe(userId)      →  is this row mine? (compares people, not devices)
memberAvatars     →  a person's photo, borrowed from any device they've used
```

**Every count in the app de-duplicates through `memberOf`** — dish votes, hearts, gear claims, poll answers, the "what everyone wants" bars, the expense split. If you add a feature that counts something, count people.

## The 19 tables

**Identity** — `members` (the twelve, plus a Venmo handle), `profiles` (devices, each pointing at a member).

**Itinerary** — `itinerary_days` (three, fixed), `itinerary_blocks` (the editable entries, ordered by `day_part` then `sort`), `forecast_cache` (one row per trip day, filled by the edge function).

**Packing** — `gear_items` (shared kit, one physical thing per row), `gear_claims` (join table: several people can bring the same thing), `personal_items` (**private** — each device gets its own copy of a 43-row seed list).

**Food** — `menu_items` (dishes; `votable` marks the two slots put to a vote), `menu_votes`, `shopping_items` (ingredients link back to a dish via `menu_item_id`; a null means somebody added it by hand).

**Money** — `expenses`, `expense_shares` (who a cost was split between — rows, not a count, so adding someone later is never retroactive), `settlements` (someone paying someone back), `expense_receipts` (photo paths).

**Feed** — `posts` (a chirp; `parent_id` points at the *root* so threads stay one level deep, `poll_options` makes it a poll), `post_likes`, `post_poll_votes`.

**Survey** — `survey`, one row per device, holding the questionnaire answers behind the crew view.

## Row-level security

Every table has RLS on. The shared ones are deliberately wide — `for all to authenticated using (true)` — which for a three-day trip among friends means "anyone with the link can edit the trip". That trade is argued in **Security** below and is not a pattern to copy.

**`personal_items` is the exception**: `using (user_id = (select auth.uid()))`. Your packing list is yours. Two details matter there — the subselect makes Postgres evaluate `auth.uid()` once per query instead of once per row, and `personal_items(user_id)` is indexed, because that table grows with *devices* (29 profiles × 43 rows) rather than with the trip.

Functions are `security invoker` so they inherit the caller's RLS. `trip_snapshot()` in particular would hand every phone everyone's private packing list if it were `definer`.

## Realtime

17 of the 19 tables publish to `supabase_realtime`. The two that don't: `itinerary_days` never changes, and `personal_items` is private — broadcasting it would push one person's list to everyone.

Events are **not** applied row by row. A change marks its table dirty and a trailing 250ms timer re-reads that table once (`REALTIME_COALESCE_MS`). A batched write — dragging to reorder, ticking a merged shopping line — is one event per row, and refetching per event would turn one person's drag into a burst of full-table reads on every phone at the campsite.

Coming back from the background refetches everything, throttled to once per 15s: iOS freezes tabs, the socket sometimes survives a night and sometimes doesn't, and a phone showing yesterday's votes doesn't look stale, it looks wrong.

## Offline, in both directions

Blackwoods has almost no signal. This is the design constraint, not an edge case.

**Reads** — every successful fetch is mirrored to `localStorage`, and boot paints that copy before the network answers. Offline, it's the whole app.

**Writes** — `lib/outbox.ts`. The distinction that makes waiting safe is *why* a write failed:

- the server answered and refused it (a constraint) → the optimistic change is wrong, so it reverts and says so;
- the request never arrived → the write is fine and only the network is missing, so it waits, and so does everything queued behind it, strictly in order.

A pill above the tab bar counts what's waiting. **The honest boundary:** queued writes survive an hour in a pocket with no signal, not the tab being killed. Optimistic state is in memory too, so both are lost together — the app never shows a tick it isn't still trying to save.

**Boot** is one round trip: `trip_snapshot()` returns all 18 boot tables as one JSON object. It used to be 18 `select *` calls. Any failure — function missing, shape unrecognised, network wobble — falls through to exactly those 18 fetches, so the worst case is the old case. One extra guard: called without a session the function answers `200` with 19 *empty* arrays (RLS correctly refusing an anonymous caller), which is a valid shape and a useless answer, so an empty roster is treated as no answer rather than allowed to blank the cache.

## Storage

Three buckets, and the difference is deliberate:

- **`receipts` — private.** A receipt can show a name next to a card's last four. Links are signed with a 7-day TTL (`0020_storage_hardening.sql`).
- **`avatars` — public.** 256px face crops behind a random uuid. Signing them would break the service worker's `/object/public/` cache rule, which is what makes faces load with no signal.
- **`posts` — public**, same reasoning: chirp photos are the sharing feature, and only public URLs are offline-cacheable.

Photos are downscaled in the browser before upload (`lib/avatar.ts`, 1400px / q0.8) — a 12MP camera shot over campground signal either takes a minute or never lands.

## Migrations

Plain SQL, applied in filename order, and **every content edit is a migration too** — menu changes, packing-list rewrites, the roster. There is no admin UI; the file is the record.

Conventions worth keeping:
- Each file opens with a comment saying *why*, not what.
- Anything touching live rows gets rehearsed inside a `begin … rollback` first.
- Postgres uses `\y` for a word boundary, **not `\b`** (which is a backspace). That silently broke one migration; see `0029b`.
- `create or replace function` cannot change a return type — drop it first.

`0029b_no_quantities_weights.sql` is numbered oddly because it was recovered: it ran against production and was never committed, so for a while the repo replayed into a database that differed from the real one. If you find yourself applying SQL by hand, write the file in the same commit.

## Standing it up from nothing

```
supabase link --project-ref <ref>     # or: supabase start, for a local stack
supabase db push                      # replays supabase/migrations in order
supabase functions deploy weather
```

Then put the project URL and anon key in `lib/config.ts` (see Security — these are public browser values by design).

## Develop

```
pnpm install
NEXT_PUBLIC_DATA_MODE=mock pnpm dev   # the whole UI, no backend needed
pnpm dev                              # against Supabase
```

Mock mode is a full second implementation of the data layer (`lib/data/mock-impl.tsx`), not a stub — the entire UI test suite runs against it. Its roster is a *fixture*, not a mirror of production.

## Test

```
pnpm lint
pnpm test:unit                        # money, feed text, offline queue, survey merge, aisles
pnpm build                            # production mode — see below
NEXT_PUBLIC_DATA_MODE=mock pnpm build
NEXT_PUBLIC_DATA_MODE=mock PORT=3107 pnpm start &
pnpm test:ui                          # ~340 end-to-end assertions at 390×844
```

**Run the production build too, not just the mock one.** Mock mode swaps out `lib/data/supabase-impl.tsx` entirely, so a green mock build says nothing about the file that runs for real users — and the prerender is where it's first executed. A `useState` declared below the `useMemo` that referenced it built fine in mock and failed every deploy for four pushes with `Cannot access 'X' before initialization`, on a site that kept serving the last good build and so looked healthy.

Kill any old `next start` before restarting — a replaced `.next` under a running server produces phantom failures that look like real regressions.

## Odds and ends a reader will trip over

- **`post_likes.emoji`** exists but only ever holds a heart. Reactions were briefly five emoji; removing the column now means a second primary-key change on a live table to tidy something no user can see, so it stays and the feed filters on `'❤️'`.
- **`personal_items` is per-device, not per-person.** Known gap: your Safari list and your Home-Screen list are different lists. Every *other* per-person thing de-duplicates through `memberOf`; this one doesn't yet.
- Unnamed rows in `profiles` are real — someone opened the app and never typed a name. That's why the device count never matches the people count.

## Security — read this before reusing any of it

The Supabase URL and anon key in `lib/config.ts` are public-by-design browser values. Access control is RLS, but **the gate is deliberately wide**: the app signs in with `signInAnonymously()`, and the shared tables are `for all to authenticated using (true)`. "Authenticated" therefore means anyone who can reach the project — not just the twelve people on the trip.

That is a considered trade for a three-day trip among friends, not a pattern to copy. What follows from it:

- Trip data — names, survey answers, the expense ledger, the itinerary, the feed — is readable and writable by anyone who knows the project ref. Treat the URL as the only thing standing in the way, and don't put anything in here you'd mind a stranger reading.
- **Receipts are the exception**, and `personal_items` is the other: both are scoped, for the reasons above.
- **Pause or delete the Supabase project after Aug 16.** The data has no reason to outlive the trip, and this posture has no reason to outlive the data. `supabase/reset_before_handoff.sql` clears the trip's content while keeping the roster, if you'd rather hand it on than delete it.
