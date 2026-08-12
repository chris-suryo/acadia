# Acadia Base Camp

One-weekend trip site for a 12-person camping trip — Blackwoods Campground, Acadia National Park, Aug 14–16, 2026. Mobile-first; built to be opened on a phone at a picnic table.

**Itinerary** — three editable day plans with live NWS weather · **Packing** — claimable group gear + a private per-person checklist · **Food** — menu by night with ingredients, a shared store list, expense split · **Explore** — trails, town, guides, and every logistics link verified.

## Stack

Next.js (App Router) + TypeScript + Tailwind on Vercel. Supabase for Postgres, anonymous auth, and Realtime — no accounts, no passwords; a device is an identity and a name claimed in the header is who you are. One Supabase Edge Function (`weather`) proxies api.weather.gov (Open-Meteo fallback) into a 2-hour cache.

- `app/`, `components/` — UI (design ported from the TripHub v4 reference)
- `lib/data/` — data layer; `NEXT_PUBLIC_DATA_MODE=mock` runs the whole UI on in-memory seed data, no backend
- `supabase/migrations/` — schema, RLS, seeds (RLS: shared tables are open to the group; personal packing lists are visible only to their owner)
- `supabase/functions/weather/` — forecast proxy (Deno)

## Develop

```
pnpm install
NEXT_PUBLIC_DATA_MODE=mock pnpm dev   # UI only, no backend needed
pnpm dev                              # against Supabase (keys in lib/config.ts)
```

## Test

```
pnpm lint
pnpm test:unit                                       # settle-up arithmetic
NEXT_PUBLIC_DATA_MODE=mock pnpm build
NEXT_PUBLIC_DATA_MODE=mock PORT=3107 pnpm start &
pnpm test:ui                                         # end-to-end, 390×844
```

## Security — read this before reusing any of it

The Supabase URL and anon key in `lib/config.ts` are public-by-design browser
values. Access control is RLS, but **the gate is deliberately wide**: the app
signs in with `signInAnonymously()`, and the shared tables are
`for all to authenticated using (true)`. "Authenticated" therefore means anyone
who can reach the project — not just the twelve people on the trip.

That is a considered trade for a three-day trip among friends, not a pattern to
copy. What follows from it:

- Trip data — names, survey answers, the expense ledger, the itinerary — is
  readable and writable by anyone who knows the project ref. Treat the URL as
  the only thing standing in the way, and don't put anything in here you'd mind
  a stranger reading.
- **Receipts are the exception.** They can carry a name next to a card's last
  four, so the bucket is private and links are signed (`0020_storage_hardening.sql`).
- Avatars stay public on purpose: 256px face crops behind a random uuid, and the
  service worker caches them on the `/object/public/` path, so signing them
  would cost a real offline guarantee for very little.
- **Pause or delete the Supabase project after Aug 16.** The data has no reason
  to outlive the trip, and this posture has no reason to outlive the data.
