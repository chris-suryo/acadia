// Explore content. Notes ported from TripHubV4.jsx; links from the verified
// registry in BUILD_SPEC §8 (confirmed live, Aug 2026).

export type SpotLink = { label: string; url: string };

export type Spot = {
  id: string;
  zone: "park" | "town";
  name: string;
  meta: string;
  links: SpotLink[];
  note: string;
};

export const SPOTS: Spot[] = [
  {
    id: "great-head",
    zone: "park",
    name: "Great Head Loop",
    meta: "1.7 mi loop · moderate · dogs allowed",
    links: [{ label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/great-head-trail-loop" }],
    note: "Starts at the far end of Sand Beach, up a set of granite steps. Open ledges look back over the beach to the Beehive, then the trail rounds the headland past the ruins of a 1915 tea house. Footing is rock most of the way — a few boulders where a small dog needs a boost. Go counterclockwise for the Sand Beach overlook early.",
  },
  {
    id: "beehive",
    zone: "park",
    name: "Beehive Loop",
    meta: "1.5 mi loop · strenuous · no dogs",
    links: [
      { label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/the-beehive-loop-trail" },
      { label: "NPS", url: "https://www.nps.gov/thingstodo/hike-beehive-loop.htm" },
    ],
    note: "Iron rungs and ladders up an exposed granite face, with real drops beside you. One direction only: up the rungs, down the Bowl Trail behind the summit. More psychological than physical, but don't touch it when the rock is wet. The Sand Beach lot fills by 8 a.m. in August.",
  },
  {
    id: "ocean-path",
    zone: "park",
    name: "Ocean Path",
    meta: "4.4 mi round trip · easy · dogs allowed",
    links: [{ label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/ocean-path-trail--2" }],
    note: "Flat coastal walk from Sand Beach to Otter Point past Thunder Hole and Monument Cove. Full sun the whole way and it parallels the Park Loop Road, so it's about the views, not solitude. Early morning is quietest.",
  },
  {
    id: "gorham",
    zone: "park",
    name: "Gorham Mountain",
    meta: "1.6 mi up-and-back · moderate · dogs allowed",
    links: [
      { label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/gorham-mountain-loop" },
      { label: "NPS", url: "https://www.nps.gov/thingstodo/hike-gorham-mountain-loop.htm" },
    ],
    note: "Steady climb over open granite ledges with the ocean behind you the whole way up. The Cadillac Cliffs spur adds a short stretch through cave-like rock features. Links directly to Ocean Path if you want to make a bigger loop of it.",
  },
  {
    id: "jordan-pond",
    zone: "park",
    name: "Jordan Pond Path",
    meta: "3.3 mi loop · easy · dogs allowed",
    links: [
      { label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/jordan-pond-path" },
      { label: "NPS", url: "https://www.nps.gov/thingstodo/hike-jordan-pond-path.htm" },
    ],
    note: "Flat loop hugging the shoreline, with log boardwalks on the west side and the Bubbles rising across the water. No swimming — it's a public water supply. Popovers at Jordan Pond House if the wait isn't absurd.",
  },
  {
    id: "carriage",
    zone: "park",
    name: "Carriage roads",
    meta: "45 mi network · easy · dogs allowed",
    links: [
      { label: "NPS", url: "https://www.nps.gov/acad/planyourvisit/carriage-roads.htm" },
      { label: "Map PDF", url: "https://www.nps.gov/acad/planyourvisit/upload/CRUMmap_508.pdf" },
    ],
    note: "Crushed-stone roads with granite bridges and no cars, built by Rockefeller a century ago. Wide with long sightlines — the easiest place in the park to pass other dogs with room to spare.",
  },
  {
    id: "thunder-hole",
    zone: "park",
    name: "Thunder Hole",
    meta: "roadside stop · 10 min",
    links: [{ label: "Tide chart", url: "https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=8413320" }],
    note: "Waves compress air in a rock inlet and detonate. Timing is everything: aim for one to two hours before high tide with some swell running. At low tide it's a quiet hole in the rocks.",
  },
  {
    id: "cadillac",
    zone: "park",
    name: "Cadillac Summit Road",
    meta: "scenic drive · $6 vehicle reservation",
    links: [{ label: "Reservations", url: "https://www.nps.gov/acad/planyourvisit/vehicle_reservations.htm" }],
    note: "Highest point on the Atlantic seaboard. Driving up requires a timed reservation May through October — 70% of slots release at 10 a.m. ET two days out. Hiking or biking up is free, no reservation.",
  },
  {
    id: "bar-harbor",
    zone: "town",
    name: "Bar Harbor",
    meta: "15 min from camp",
    links: [],
    note: "Shops, ice cream, and the Shore Path along the waterfront. The village green is the main Island Explorer hub if anyone wants to ditch the car.",
  },
  {
    id: "bar-island",
    zone: "town",
    name: "Bar Island land bridge",
    meta: "tide-dependent · free",
    links: [{ label: "Tide chart", url: "https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=8413320" }],
    note: "A gravel bar to Bar Island surfaces around low tide — walkable roughly 1.5 hours either side. Check the tide chart before crossing; the water comes back faster than people expect.",
  },
  {
    id: "otter-creek",
    zone: "town",
    name: "Otter Creek",
    meta: "0.5 mi from Blackwoods",
    links: [],
    note: "Coin-op showers and a small camp store. Blackwoods has none of either, so this is the day-two stop.",
  },
  {
    id: "seafood",
    zone: "town",
    name: "Lobster on the pier",
    meta: "Bar Harbor",
    links: [],
    note: "A dozen options within two blocks of the water. Cooking for twelve three days straight is a lot — one dinner out is a reasonable escape valve.",
  },
  {
    id: "shuttle",
    zone: "town",
    name: "Island Explorer shuttle",
    meta: "free · stops at Blackwoods",
    links: [{ label: "Route 10", url: "https://exploreacadia.com/route10.html" }],
    note: "Free buses across the island, late June to mid-October, with a stop at the campground entrance. Solves the Sand Beach parking problem. Leashed dogs ride on the floor.",
  },
];

export const EATS: { name: string; meta: string }[] = [
  { name: "Stewman's Lobster Pound", meta: "waterfront picnic tables · dog patio" },
  { name: "Side Street Cafe", meta: "" },
  { name: "Testa's", meta: "heated dog patio" },
  { name: "Paddy's Irish Pub", meta: "waterfront · dog patio" },
  { name: "CherrySTONES", meta: "covered dog patio" },
];

export const EATS_DIRECTORY = {
  label: "Dog-friendly directory",
  url: "https://www.bringfido.com/restaurant/city/bar_harbor_me_us/",
  domain: "bringfido.com",
};

export const GUIDES: { name: string; why: string; url: string; domain: string }[] = [
  {
    name: "Joe's Guide to Acadia",
    why: "the most detailed free trail-by-trail guide to the park",
    url: "https://www.citrusmilo.com/acadiaguide/",
    domain: "citrusmilo.com",
  },
  {
    name: "Dog Friendly Acadia 2026",
    why: "current, dog-specific, covers off-leash spots",
    url: "https://thewellwornshoes.com/isacadiadogfriendly/",
    domain: "thewellwornshoes.com",
  },
  {
    name: "James Kaiser — Acadia camping",
    why: "clearest Blackwoods vs. other campgrounds overview",
    url: "https://jameskaiser.com/acadia-guide/acadia-camping/",
    domain: "jameskaiser.com",
  },
  {
    name: "NPPlan — Blackwoods",
    why: "granular loop/site logistics",
    url: "https://npplan.com/parks-by-state/maine-national-parks/acadia-national-park-park-at-a-glance/acadia-national-park-campgrounds/acadia-national-park-blackwoods-campground/",
    domain: "npplan.com",
  },
  {
    name: "Roaming Roadtrippers dog guide",
    why: "dog-friendly itineraries",
    url: "https://www.roamingroadtrippers.com/dog-friendly-guide-acadia/",
    domain: "roamingroadtrippers.com",
  },
];

export const MAP_PDF_URL =
  "https://cdn.recreation.gov/public/2020/01/21/20/51/232508_d298a543-8e13-4df2-bf05-711c7aae2523.pdf";

export const LINKS: { label: string; url: string; domain: string }[] = [
  { label: "Blackwoods on Recreation.gov", url: "https://www.recreation.gov/camping/poi/232508", domain: "recreation.gov" },
  { label: "Blackwoods map (PDF)", url: MAP_PDF_URL, domain: "recreation.gov" },
  { label: "Blackwoods campground — NPS", url: "https://www.nps.gov/acad/planyourvisit/blackwoods-campground.htm", domain: "nps.gov" },
  { label: "Entrance passes", url: "https://go.nps.gov/AcadiaPass", domain: "nps.gov" },
  { label: "Cadillac booking — daytime", url: "https://www.recreation.gov/timed-entry/400000/ticket/4002", domain: "recreation.gov" },
  { label: "Cadillac booking — sunrise", url: "https://www.recreation.gov/timed-entry/400000/ticket/4001", domain: "recreation.gov" },
  { label: "Island Explorer Route 10 — Blackwoods", url: "https://exploreacadia.com/route10.html", domain: "exploreacadia.com" },
  { label: "Bar Harbor tide chart", url: "https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=8413320", domain: "noaa.gov" },
  { label: "Hot Showers Acadia — Otter Creek", url: "https://www.facebook.com/p/Hot-Showers-Acadia-100047391116295/", domain: "facebook.com" },
  { label: "Maine firewood rules", url: "https://www.maine.gov/dacf/mfs/forest_health/invasive_threats/firewood_out_of_state_ban_faqs.html", domain: "maine.gov" },
  { label: "Acadia BARK Ranger — pet rules", url: "https://www.nps.gov/articles/be-an-acadia-bark-ranger.htm", domain: "nps.gov" },
  { label: "Bar Harbor forecast", url: "https://forecast.weather.gov/MapClick.php?lat=44.3792&lon=-68.2249", domain: "weather.gov" },
];
