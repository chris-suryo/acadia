// Weather proxy (BUILD_SPEC §6). NWS is primary — it requires a User-Agent
// and has unreliable browser CORS, so it runs server-side. Open-Meteo is the
// fallback. Results land in forecast_cache; clients read the cache and invoke
// this function only when it's stale (>2h).

import { createClient } from "npm:@supabase/supabase-js@2";

const LAT = 44.31;
const LON = -68.2;
const USER_AGENT = "(acadia-base-camp, csuryo55@gmail.com)";
const TRIP_DATES = ["2026-08-14", "2026-08-15", "2026-08-16"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Row = {
  date_key: string;
  high: number | null;
  low: number | null;
  condition: string | null;
  source: string;
};

let nwsForecastUrl: string | null = null; // resolved once per instance

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/geo+json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function fetchNws(): Promise<Row[]> {
  if (!nwsForecastUrl) {
    const points = (await getJson(
      `https://api.weather.gov/points/${LAT},${LON}`,
    )) as { properties?: { forecast?: string } };
    nwsForecastUrl = points.properties?.forecast ?? null;
    if (!nwsForecastUrl) throw new Error("no forecast url in points response");
  }
  const forecast = (await getJson(nwsForecastUrl)) as {
    properties?: {
      periods?: {
        startTime: string;
        isDaytime: boolean;
        temperature: number;
        shortForecast: string;
      }[];
    };
  };
  const periods = forecast.properties?.periods ?? [];
  const rows: Row[] = [];
  for (const date of TRIP_DATES) {
    const day = periods.find(
      (p) => p.isDaytime && p.startTime.slice(0, 10) === date,
    );
    const night = periods.find(
      (p) => !p.isDaytime && p.startTime.slice(0, 10) === date,
    );
    if (!day && !night) continue;
    rows.push({
      date_key: date,
      high: day?.temperature ?? null,
      low: night?.temperature ?? null,
      condition: day?.shortForecast ?? night?.shortForecast ?? null,
      source: "nws",
    });
  }
  if (!rows.length) throw new Error("nws returned no trip-day periods");
  return rows;
}

const WMO: [number, number, string][] = [
  [0, 0, "Clear"],
  [1, 2, "Partly cloudy"],
  [3, 3, "Overcast"],
  [45, 48, "Fog"],
  [51, 67, "Rain"],
  [71, 77, "Snow"],
  [80, 82, "Showers"],
  [85, 86, "Snow showers"],
  [95, 99, "Thunderstorms"],
];

function wmoText(code: number): string {
  for (const [lo, hi, text] of WMO) if (code >= lo && code <= hi) return text;
  return "—";
}

async function fetchOpenMeteo(): Promise<Row[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&temperature_unit=fahrenheit&timezone=America%2FNew_York` +
    `&start_date=${TRIP_DATES[0]}&end_date=${TRIP_DATES[TRIP_DATES.length - 1]}`;
  const data = (await getJson(url)) as {
    daily?: {
      time: string[];
      temperature_2m_max: (number | null)[];
      temperature_2m_min: (number | null)[];
      weather_code: (number | null)[];
    };
  };
  const d = data.daily;
  if (!d) throw new Error("open-meteo: no daily block");
  const rows: Row[] = d.time
    .map((date, i) => ({
      date_key: date,
      high: d.temperature_2m_max[i] != null ? Math.round(d.temperature_2m_max[i]!) : null,
      low: d.temperature_2m_min[i] != null ? Math.round(d.temperature_2m_min[i]!) : null,
      condition: d.weather_code[i] != null ? wmoText(d.weather_code[i]!) : null,
      source: "open-meteo",
    }))
    .filter((r) => TRIP_DATES.includes(r.date_key));
  if (!rows.length) throw new Error("open-meteo returned no trip days");
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }
  try {
    let rows: Row[];
    try {
      rows = await fetchNws();
    } catch (e) {
      console.warn("nws failed, falling back to open-meteo:", e);
      rows = await fetchOpenMeteo();
    }
    const stamped = rows.map((r) => ({
      ...r,
      fetched_at: new Date().toISOString(),
    }));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase
      .from("forecast_cache")
      .upsert(stamped, { onConflict: "date_key" });
    if (error) throw error;
    return new Response(JSON.stringify({ rows: stamped }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
