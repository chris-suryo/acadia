// Explore content. Notes ported from TripHubV4.jsx; links from the verified
// registry in BUILD_SPEC §8 (confirmed live, Aug 2026).

export type SpotLink = { label: string; url: string };

/** Trail rating. Rendered as a bar meter, never spelled out. */
export type TrailLevel = "easy" | "moderate" | "hard";

export type Spot = {
  id: string;
  zone: "park" | "town";
  name: string;
  meta: string;
  /** Hikes only — drives the difficulty meter next to the distance. */
  difficulty?: TrailLevel;
  /** Carousel form of `meta`, which is too long for a 128px card. */
  short?: string;
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
    meta: "1.7 mi loop · dogs allowed",
    difficulty: "moderate",
    short: "1.7 mi loop",
    links: [{ label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/great-head-trail-loop" }],
    note: "Starts at the far end of Sand Beach, up a set of granite steps. Open ledges look back over the beach to the Beehive, then the trail rounds the headland past the ruins of a 1915 tea house. Footing is rock most of the way — a few boulders where a small dog needs a boost. Go counterclockwise for the Sand Beach overlook early.",
    photo: photo("great-head.jpg", "John, Wikimedia · CC BY-SA 2.0"),
  },
  {
    id: "beehive",
    zone: "park",
    name: "Beehive Loop",
    meta: "1.5 mi loop · no dogs",
    difficulty: "hard",
    short: "1.5 mi loop",
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
    meta: "4.4 mi round trip · dogs allowed",
    difficulty: "easy",
    short: "4.4 mi round trip",
    links: [{ label: "Trail map", url: "https://www.alltrails.com/trail/us/maine/ocean-path-trail--2" }],
    note: "Flat coastal walk from Sand Beach to Otter Point past Thunder Hole and Monument Cove. Full sun the whole way and it parallels the Park Loop Road, so it's about the views, not solitude. Early morning is quietest.",
    photo: photo("ocean-path.jpg", "John, Wikimedia · CC BY-SA 2.0"),
  },
  {
    id: "gorham",
    zone: "park",
    name: "Gorham Mountain",
    meta: "1.6 mi up-and-back · dogs allowed",
    difficulty: "moderate",
    short: "1.6 mi up-and-back",
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
    meta: "3.3 mi loop · dogs allowed",
    difficulty: "easy",
    short: "3.3 mi loop",
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
    meta: "45 mi network · dogs allowed",
    difficulty: "easy",
    short: "45 mi network",
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
    meta: "55°F water · no dogs in summer",
    short: "55°F swim",
    links: [{ label: "NPS", url: "https://www.nps.gov/thingstodo/swim-sand-beach.htm" }],
    note: "The only true sand beach on this side of the island, boxed in by granite headlands. The water is a dare — most people last about a minute. Lot fills by 8 a.m.; the Island Explorer or the Ocean Path from another lot solves it. Dogs are barred from the sand June 15 to September 8, which covers our weekend — someone has to stay up at the lot with them.",
    photo: photo("sand-beach.jpg", "Dougtone · CC BY-SA 2.0"),
  },
  {
    id: "echo-lake",
    zone: "park",
    name: "Echo Lake Beach",
    meta: "the warm swim · 20 min · no dogs in summer",
    short: "the warm swim",
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
    note: "A dozen options within two blocks of the water. Cooking for eleven three days straight is a lot — one dinner out is a reasonable escape valve.",
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
// reliable path to hours, directions and menus. Addresses confirmed Aug 2026;
// `street` doubles as the card caption so the list reads as a walking route.
//
// Order: best fit for eleven people first (big menus, walk-ins, patios), then
// the rest. Bar Harbor's restaurants sit in three clusters — Rodick/Cottage in
// the middle of town, Main St running south, West St on the waterfront — and
// the order keeps each cluster together so a night out doesn't zig-zag.
//
// Photos are each restaurant's own published shot, resized into our `spots`
// bucket; West Street Cafe's is a CC0 Commons photo. Credit rides along.
const appleMaps = (q: string, street: string) =>
  `https://maps.apple.com/?q=${encodeURIComponent(`${q}, ${street}, Bar Harbor ME`)}`;

export const EATS: {
  name: string;
  street: string;
  meta: string;
  maps: string;
  site?: string;
  photo?: { src: string; credit: string };
}[] = [
  {
    name: "Side Street Cafe",
    street: "49 Rodick St",
    meta: "big menu · dog patio",
    maps: appleMaps("Side Street Cafe", "49 Rodick St"),
    site: "https://sidestreetbarharbor.com",
    photo: photo("eat-side-street.jpg", "Side Street Cafe"),
  },
  {
    name: "Thirsty Whale",
    street: "40 Cottage St",
    meta: "tavern · walk-ins, late",
    maps: appleMaps("Thirsty Whale Tavern", "40 Cottage St"),
    site: "https://www.thirstywhaletavern.com",
    photo: photo("eat-thirsty-whale.jpg", "Thirsty Whale Tavern"),
  },
  {
    name: "Geddy's",
    street: "19 Main St",
    meta: "casual seafood · live music",
    maps: appleMaps("Geddy's", "19 Main St"),
    site: "https://www.geddys.com",
    photo: photo("eat-geddys.jpg", "Geddy's"),
  },
  {
    name: "Galyn's",
    street: "17 Main St",
    meta: "harbor views upstairs",
    maps: appleMaps("Galyn's", "17 Main St"),
    site: "https://www.galynsbarharbor.com",
    photo: photo("eat-galyns.jpg", "Aaron Snow Photography / Galyn's"),
  },
  {
    name: "Testa's",
    street: "53 Main St",
    meta: "heated dog patio",
    maps: appleMaps("Testa's Bar & Grill", "53 Main St"),
    site: "https://www.testasbarharbor.com",
    photo: photo("eat-testas.jpg", "Testa's Bar & Grill"),
  },
  {
    name: "CherrySTONES",
    street: "185 Main St",
    meta: "covered dog patio",
    maps: appleMaps("CherrySTONES", "185 Main St"),
    site: "https://cherrystonesme.com",
    photo: photo("eat-cherrystones.jpg", "CherrySTONES"),
  },
  {
    name: "Poor Boy's Gourmet",
    street: "300 Main St",
    meta: "big menu · closest to camp",
    maps: appleMaps("Poor Boy's Gourmet", "300 Main St"),
    site: "https://www.poorboysgourmet.com",
    photo: photo("eat-poor-boys.jpg", "Poor Boy's Gourmet"),
  },
  {
    name: "Stewman's Lobster Pound",
    street: "35 West St",
    meta: "waterfront · dog patio",
    maps: appleMaps("Stewman's Lobster Pound", "35 West St"),
    site: "https://stewmanslobsterpound.com",
    photo: photo("eat-stewmans.jpg", "Aaron Zhu · CC BY-SA 3.0"),
  },
  {
    name: "Paddy's Irish Pub",
    street: "50 West St",
    meta: "pub · dog patio",
    maps: appleMaps("Paddy's Irish Pub", "50 West St"),
    site: "https://paddysbarharbor.com",
    photo: photo("eat-paddys.jpg", "Paddy's Irish Pub"),
  },
  {
    name: "West Street Cafe",
    street: "76 West St",
    meta: "lobster dinners",
    maps: appleMaps("West Street Cafe", "76 West St"),
    site: "https://www.weststreetcafe.com",
    photo: photo("eat-west-street.jpg", "Saalebaer, Wikimedia · CC0"),
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
  // The park caps each site at two tents, six people and one vehicle. Two
  // sites is four tents and two cars for eleven of us — which is a problem
  // that only shows up when four cars arrive at a gate that expects two.
  { text: "Two tents and one car per site: four tents, two cars for the eleven of us." },
  { text: "Water spigots and flush toilets in every loop." },
  { text: "Food sleeps in the cars — raccoons work this campground." },
  { text: "Buy firewood on the island; out-of-state wood is banned." },
  { text: "Quiet hours 10 pm–6 am." },
  // Genuinely banned, not merely discouraged — worth knowing before someone
  // packs a set.
  { text: "No string lights, tiki torches or bug zappers — the park bans them." },
  { text: "Little to no cell signal." },
];

export const MAP_PDF_URL =
  "https://cdn.recreation.gov/public/2020/01/21/20/51/232508_d298a543-8e13-4df2-bf05-711c7aae2523.pdf";

/**
 * Everything the app needs on disk before anyone leaves for the trip.
 *
 * Blackwoods has no signal, and images are otherwise only cached once they
 * scroll into view — seven of the ten dinner cards start off-screen, so the
 * one moment you'd open the app at camp to pick a restaurant is the moment
 * those cards would be blank. The service worker pulls this list down while
 * there's still a network. Roughly 2 MB.
 */
export const OFFLINE_MEDIA: string[] = [
  ...SPOTS.flatMap((s) => (s.photo ? [s.photo.src] : [])),
  ...EATS.flatMap((e) => (e.photo ? [e.photo.src] : [])),
  "/maps/blackwoods-thumb.png",
  "/maps/blackwoods-map-small.png",
  "/maps/blackwoods-map.png",
];

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
