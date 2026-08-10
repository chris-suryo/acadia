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

The Supabase URL + anon key in `lib/config.ts` are public-by-design browser values; access control is enforced by RLS.
