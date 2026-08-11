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
  /** Storage-hosted photo + attribution (shown in the tap-to-open viewer). */
  photo?: { src: string; credit: string };
};

// Spot photos live in the public `spots` storage bucket — 960px Wikimedia
// Commons / NPS copies, licenses verified Aug 2026; credit shown in the
// photo viewer.
const PHOTO_BASE =
  "https://jboghghdxgxgpccmqnlq.supabase.co/storage/v1/object/public/spots";
const photo = (file: string, credit: string) => ({
  src: `${PHOTO_BASE}/${file}`,
  credit,
});

export const SPOTS: Spot[] = [
  {
    id: "great-head",
    zone: "park",
    name: "Great Head Loop",
    meta: "1.7 mi loop · moderate · dogs allowed",
    links: [{ label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/great-head-trail-loop" }],
    note: "Starts at the far end of Sand Beach, up a set of granite steps. Open ledges look back over the beach to the Beehive, then the trail rounds the headland past the ruins of a 1915 tea house. Footing is rock most of the way — a few boulders where a small dog needs a boost. Go counterclockwise for the Sand Beach overlook early.",
    photo: photo("great-head.jpg", "John, Wikimedia · CC BY-SA 2.0"),
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
    photo: photo("beehive.jpg", "Jeff Gunn · CC BY 2.0"),
  },
  {
    id: "ocean-path",
    zone: "park",
    name: "Ocean Path",
    meta: "4.4 mi round trip · easy · dogs allowed",
    links: [{ label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/ocean-path-trail--2" }],
    note: "Flat coastal walk from Sand Beach to Otter Point past Thunder Hole and Monument Cove. Full sun the whole way and it parallels the Park Loop Road, so it's about the views, not solitude. Early morning is quietest.",
    photo: photo("ocean-path.jpg", "John, Wikimedia · CC BY-SA 2.0"),
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
    photo: photo("gorham.jpg", "NPS / Victoria Stauffenberg · public domain"),
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
    photo: photo("jordan-pond.jpg", "NPS / Victoria Stauffenberg · public domain"),
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
    photo: photo("carriage.jpg", "Kinderhart, Wikimedia · CC BY-SA 3.0"),
  },
  {
    id: "sand-beach",
    zone: "park",
    name: "Sand Beach",
    meta: "swim at your own risk · 55°F water",
    links: [{ label: "NPS", url: "https://www.nps.gov/thingstodo/swim-sand-beach.htm" }],
    note: "The only true sand beach on this side of the island, boxed in by granite headlands. The water is a dare — most people last about a minute. Lot fills by 8 a.m.; the Island Explorer or the Ocean Path from another lot solves it.",
    photo: photo("sand-beach.jpg", "Dougtone · CC BY-SA 2.0"),
  },
  {
    id: "echo-lake",
    zone: "park",
    name: "Echo Lake Beach",
    meta: "the warm swim · 20 min from camp",
    links: [{ label: "NPS", url: "https://www.nps.gov/thingstodo/swim-echo-lake-beach.htm" }],
    note: "Freshwater and genuinely swimmable — 10 to 15 degrees warmer than the ocean, with Beech Cliff rising straight off the far shore. Lifeguards in summer. This is the one the swimsuits on the packing list are for. No dogs in summer.",
    photo: photo("echo-lake.jpg", "NPS / Victoria Stauffenberg · public domain"),
  },
  {
    id: "bass-harbor",
    zone: "park",
    name: "Bass Harbor Head Lighthouse",
    meta: "sunset run · 25 min from camp",
    links: [{ label: "NPS", url: "https://www.nps.gov/acad/planyourvisit/bass-harbor-head-light-station.htm" }],
    note: "The postcard lighthouse on the island's quiet side. The classic shot is from the rocks below the tiny parking lot — steps down on the left side. Golden hour draws a crowd to a lot that holds maybe fifteen cars; go early or embrace the shuffle.",
    photo: photo("bass-harbor.jpg", "NPS photo · public domain"),
  },
  {
    id: "thunder-hole",
    zone: "park",
    name: "Thunder Hole",
    meta: "roadside stop · 10 min",
    links: [{ label: "Tide chart", url: "https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=8413320" }],
    note: "Waves compress air in a rock inlet and detonate. Timing is everything: aim for one to two hours before high tide with some swell running. At low tide it's a quiet hole in the rocks.",
    photo: photo("thunder-hole.jpg", "Pablo Sanchez · CC BY 2.0"),
  },
  {
    id: "cadillac",
    zone: "park",
    name: "Cadillac Summit Road",
    meta: "scenic drive · $6 vehicle reservation",
    links: [{ label: "Reservations", url: "https://www.nps.gov/acad/planyourvisit/vehicle_reservations.htm" }],
    note: "Highest point on the Atlantic seaboard. Driving up requires a timed reservation May through October — 70% of slots release at 10 a.m. ET two days out. Hiking or biking up is free, no reservation.",
    photo: photo("cadillac.jpg", "WaxPhilosophic, Wikimedia · CC BY-SA 4.0"),
  },
  {
    id: "bar-harbor",
    zone: "town",
    name: "Bar Harbor",
    meta: "15 min from camp",
    links: [],
    note: "Shops, ice cream, and the Shore Path along the waterfront. The village green is the main Island Explorer hub if anyone wants to ditch the car.",
    photo: photo("bar-harbor.jpg", "Nucleosynth, Wikimedia · CC BY-SA 4.0"),
  },
  {
    id: "bar-island",
    zone: "town",
    name: "Bar Island land bridge",
    meta: "tide-dependent · free",
    links: [{ label: "Tide chart", url: "https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=8413320" }],
    note: "A gravel bar to Bar Island surfaces around low tide — walkable roughly 1.5 hours either side. Check the tide chart before crossing; the water comes back faster than people expect.",
    photo: photo("bar-island.jpg", "EgorovaSvetlana, Wikimedia · CC BY-SA 4.0"),
  },
  {
    id: "otter-creek",
    zone: "town",
    name: "Otter Creek",
    meta: "0.5 mi from Blackwoods",
    links: [],
    note: "Coin-op showers and a small camp store. Blackwoods has none of either, so this is the day-two stop.",
    photo: photo("otter-creek.jpg", "EgorovaSvetlana, Wikimedia · CC BY-SA 4.0"),
  },
  {
    id: "seafood",
    zone: "town",
    name: "Lobster on the pier",
    meta: "Bar Harbor",
    links: [],
    note: "A dozen options within two blocks of the water. Cooking for twelve three days straight is a lot — one dinner out is a reasonable escape valve.",
    photo: photo("seafood.jpg", "Lee Coursey · CC BY 2.0"),
  },
  {
    id: "shuttle",
    zone: "town",
    name: "Island Explorer shuttle",
    meta: "free · stops at Blackwoods",
    links: [{ label: "Route 10", url: "https://exploreacadia.com/route10.html" }],
    note: "Free buses across the island, late June to mid-October, with a stop at the campground entrance. Solves the Sand Beach parking problem. Leashed dogs ride on the floor.",
    photo: photo("shuttle.jpg", "NPS photo · public domain"),
  },
];

// Apple Maps opens the app on an iPhone and a web map elsewhere — it's the
// reliable path to hours, directions and menus. Official sites are listed
// only where a request confirmed them live (Aug 2026); Testa's, CherrySTONES
// and Thirsty Whale had no reachable site. Ordered group-friendliest first.
const appleMaps = (q: string) =>
  `https://maps.apple.com/?q=${encodeURIComponent(`${q} Bar Harbor ME`)}`;

export const EATS: {
  name: string;
  meta: string;
  maps: string;
  site?: string;
  photo?: { src: string; credit: string };
}[] = [
  {
    name: "Side Street Cafe",
    meta: "big menu · in town",
    maps: appleMaps("Side Street Cafe"),
    site: "https://sidestreetbarharbor.com",
  },
  {
    name: "Geddy's",
    meta: "casual seafood",
    maps: appleMaps("Geddy's"),
    site: "https://www.geddys.com",
  },
  {
    name: "Poor Boy's Gourmet",
    meta: "big menu",
    maps: appleMaps("Poor Boy's Gourmet"),
    site: "https://www.poorboysgourmet.com",
  },
  {
    name: "Stewman's Lobster Pound",
    meta: "waterfront · dog patio",
    maps: appleMaps("Stewman's Lobster Pound"),
    site: "https://stewmanslobsterpound.com",
    photo: photo("eat-stewmans.jpg", "Aaron Zhu · CC BY-SA 3.0"),
  },
  {
    name: "Galyn's",
    meta: "waterfront",
    maps: appleMaps("Galyn's"),
    site: "https://www.galynsbarharbor.com",
  },
  {
    name: "West Street Cafe",
    meta: "seafood + lobster dinners",
    maps: appleMaps("West Street Cafe"),
    site: "https://www.weststreetcafe.com",
  },
  {
    name: "Paddy's Irish Pub",
    meta: "waterfront · dog patio",
    maps: appleMaps("Paddy's Irish Pub"),
    site: "https://paddysbarharbor.com",
  },
  {
    name: "Testa's",
    meta: "heated dog patio",
    maps: appleMaps("Testa's Restaurant"),
  },
  {
    name: "CherrySTONES",
    meta: "covered dog patio",
    maps: appleMaps("CherrySTONES"),
  },
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
    url: "https://npplan.com/parks-by-state/maine-national-parks/acadia-national-park-park-at-a-glance/acadia-national-park-camping/acadia-national-park-blackwoods-campground/",
    domain: "npplan.com",
  },
  {
    name: "Roaming Roadtrippers dog guide",
    why: "dog-friendly itineraries",
    url: "https://www.roamingroadtrippers.com/dog-friendly-guide-acadia/",
    domain: "roamingroadtrippers.com",
  },
];

// The things about Blackwoods people ask at camp, once each.
export const CAMP_NOTES: { text: string; link?: SpotLink }[] = [
  {
    text: "No showers at Blackwoods.",
    link: { label: "Otter Creek, ½ mi", url: "https://maps.apple.com/?q=Hot+Showers+Acadia+Otter+Creek+ME" },
  },
  { text: "Water spigots and flush toilets in every loop." },
  { text: "Food sleeps in the cars — raccoons work this campground." },
  { text: "Buy firewood on the island; out-of-state wood is banned." },
  { text: "Quiet hours 10 pm–6 am." },
  { text: "Little to no cell signal." },
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
