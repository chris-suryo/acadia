// End-to-end UI suite. Run against a production build in mock mode:
//
//   NEXT_PUBLIC_DATA_MODE=mock pnpm build
//   NEXT_PUBLIC_DATA_MODE=mock PORT=3107 pnpm start
//   node test/ui-test.mjs
//
// Kill any old `next start` before restarting — a replaced .next under a
// running server produces phantom failures that look like real regressions.
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:3107";
const SHOT_DIR = process.env.SHOT_DIR || "/tmp/abc-shots";
// A 1x1 JPEG, enough to exercise upload/crop/attach paths without a fixture file.
const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64",
);
const results = [];
const ok = (name, cond, detail = "") => {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

(async () => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  /** Drag a row left far enough to trip SwipeRow's delete. */
  const swipeRow = async (row) => {
    await row.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const b = await row.boundingBox();
    await page.mouse.move(b.x + b.width - 16, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width - 40, b.y + b.height / 2, { steps: 3 });
    await page.mouse.move(b.x + 20, b.y + b.height / 2, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  };
  // CI installs the browser Playwright expects and needs no override. Sandboxes
  // that ship a pinned Chromium of a different build set PW_CHROMIUM to it.
  const browser = await chromium.launch(
    process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  );
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  // Skip the first-open Welcome for the main suite; it gets its own contexts below.
  await page.addInitScript(() => localStorage.setItem("abc.welcomed", "1"));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  // ---- Itinerary tab: schedule-first, ideas below ----
  ok("header title", await page.getByRole("heading", { name: "Acadia Base Camp" }).isVisible());
  ok("bottom nav fixed", (await page.locator("nav.fixed.bottom-0").count()) === 1);
  ok("no segments on itinerary", (await page.getByRole("button", { name: "Schedule" }).count()) === 0);
  // The itinerary is the trip and nothing else — no card of asks above it.
  ok("nothing above the schedule", (await page.getByText("Before Friday").count()) === 0);
  ok("what people want section", await page.getByText("What people want").isVisible());
  ok("alana idea card below schedule", await page.getByText("Beehive if the ladders aren't crowded").isVisible());
  // Food requests live here now — the Food tab is votes and a list, nothing else.
  ok("food requests show on the ideas board", await page.getByText("S'mores. Non-negotiable.").isVisible());
  ok("add yours ghost", await page.getByRole("button", { name: "Add yours" }).isVisible());
  const schedThumbs = await page.locator('[data-day] img.w-11').count();
  ok("schedule entry photos", schedThumbs === 3, `${schedThumbs} linked-entry thumbs`);
  await page.screenshot({ path: `${SHOT_DIR}/0-schedule.png`, fullPage: true });

  // ---- Board model ----
  ok("weather renders", (await page.getByText("79\u00b0 / 57\u00b0").count()) === 1);
  ok("trip skeleton content", await page.getByText("Camp setup", { exact: true }).isVisible());
  ok("rolling-in entry gone", (await page.getByText("Rolling in all day").count()) === 0);
  ok("staggered-arrivals text gone", (await page.getByText(/text the thread/).count()) === 0);
  ok("saturday is park day", await page.getByText("Dinner in Bar Harbor").isVisible());
  ok("no Save button anywhere", (await page.getByRole("button", { name: "Save" }).count()) === 0);
  ok("no day edit mode", (await page.getByLabel("Edit Friday").count()) === 0);
  const fri = page.locator('[data-day="fri"]');
  ok("day-part dividers", (await fri.getByText("Afternoon", { exact: true }).count()) === 1 && (await fri.getByText("Evening", { exact: true }).count()) === 1);

  // camp card with the loop map
  ok("camp card on schedule", await page.getByText("Base camp \u2014 Blackwoods").isVisible());
  ok("sites on camp card", await page.getByText(/sites B080 \+ B082 · B loop/).isVisible());
  ok("directions link", (await page.locator('[data-day="fri"] a[href*="maps.apple.com"]').count()) === 1);
  ok("camp card inside friday", (await page.locator('[data-day="fri"]').getByText("Base camp \u2014 Blackwoods").count()) === 1);
  ok("camp card is just the sites", (await page.getByText(/State Highway 3/).count()) === 0 && (await page.getByText(/check-in 1 pm/).count()) === 0);
  ok("show map link", await page.getByRole("button", { name: "show map" }).isVisible());
  await page.getByRole("button", { name: "camp notes" }).click();
  await page.waitForTimeout(300);
  ok("camp notes sheet", await page.getByText(/No showers at Blackwoods/).isVisible());
  ok("shower link", (await page.locator('a[href*="Hot%20Showers"], a[href*="Hot+Showers"]').count()) === 1);
  ok("body scroll locked", (await page.evaluate(() => getComputedStyle(document.body).overflow)) === "hidden");
  await page.getByRole("button", { name: "Got it" }).click();
  await page.waitForTimeout(250);
  ok("camp notes closes", (await page.getByText(/No showers at Blackwoods/).count()) === 0);
  ok("body scroll restored", (await page.evaluate(() => getComputedStyle(document.body).overflow)) !== "hidden");
  ok("weather links to forecast", (await page.locator('a[href*="forecast.weather.gov"]').count()) === 3);
  await page.getByLabel("Open the loop map").click();
  await page.waitForTimeout(300);
  ok("camp card opens map", await page.getByLabel("Close map").isVisible());
  await page.getByLabel("Close map").click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOT_DIR}/1-itinerary.png`, fullPage: true });

  // tap-to-edit + autosave on tap-outside
  await fri.getByText("Camp setup", { exact: true }).click();
  await page.waitForTimeout(250);
  const titleInput = page.locator('input[value="Camp setup"]');
  ok("tap expands to inline edit", await titleInput.isVisible());
  await titleInput.fill("Camp setup by 3");
  await page.screenshot({ path: `${SHOT_DIR}/1b-entry-expanded.png` });
  await page.getByRole("heading", { name: /Friday/ }).click();
  await page.waitForTimeout(300);
  ok("autosaved on tap-away", await fri.getByText("Camp setup by 3").isVisible());
  ok("edit fields closed", (await page.locator('input[value="Camp setup by 3"]').count()) === 0);

  ok("one add per day", (await fri.getByRole("button", { name: /Add/ }).count()) === 1);

  // ghost add: Enter commits and stays open
  await fri.getByRole("button", { name: /Add/ }).click();
  await page.waitForTimeout(150);
  await page.keyboard.type("Coffee run");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  ok("ghost add commits", await fri.getByText("Coffee run").isVisible());
  const stillOpen = await fri.locator("input").count();
  ok("ghost add stays open", stillOpen === 1);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);

  // day-part chips move entries between groups
  await fri.getByText("Coffee run").click();
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Evening", exact: true }).click();
  await page.waitForTimeout(300);
  ok("chip moved entry to evening", (await fri.locator('[data-part="evening"] input[value="Coffee run"]').count()) === 1);

  // explicit Done commits and closes the editor
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(250);
  ok("entry done closes editor", (await page.locator('input[value="Coffee run"]').count()) === 0);
  await fri.locator('[data-part="evening"]').getByText("Coffee run").click();
  await page.waitForTimeout(250);

  // delete + undo (entry still expanded inside evening)
  await page.getByLabel("Delete entry").click();
  await page.waitForTimeout(250);
  ok("entry deleted", (await fri.getByText("Coffee run").count()) === 0);
  ok("undo snackbar", await page.getByRole("button", { name: "Undo" }).isVisible());
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(250);
  ok("undo restores entry", await fri.locator('[data-part="evening"]').getByText("Coffee run").isVisible());

  // Saturday options strip + entry photo tap both jump to Explore
  ok("hikes carousel", await page.getByText("Hikes", { exact: true }).isVisible());
  ok("dinner carousel", (await page.locator(".snap-start").count()) === 16, "6 hikes + 10 eats");
  ok("dinner cards link to maps", (await page.locator('a.snap-start[href*="maps.apple.com"]').count()) === 10);
  ok("thirsty whale on the list", await page.getByText("Thirsty Whale").first().isVisible());
  
  await page.locator("button.snap-start").first().click();
  await page.waitForTimeout(800);
  ok("option card jumps to park", await page.getByText("Beehive Loop").isVisible());
  await page.getByRole("button", { name: "Itinerary" }).click();
  await page.waitForTimeout(400);
  await page.locator('[data-day] img.w-11').first().click();
  await page.waitForTimeout(800);
  ok("entry photo jumps to explore", await page.getByText("Island Explorer shuttle").isVisible());
  ok("photo tap did not open editor", (await page.locator('input[value="Shuttle or cars"]').count()) === 0);
  await page.getByRole("button", { name: "Itinerary" }).click();
  await page.waitForTimeout(400);

  // details jump: first linked entry is Saturday's shuttle call → town zone
  await page.getByRole("button", { name: "details", exact: true }).first().click();
  await page.waitForTimeout(800);
  ok("details jump lands on town segment", await page.getByText("Island Explorer shuttle").isVisible());
  ok("park section hidden on town", (await page.getByText("In the park").count()) === 0);
  await page.screenshot({ path: `${SHOT_DIR}/2-explore-highlight.png` });

  // ---- Explore: Town ----
  ok("eat with a group", await page.getByText("Stewman's Lobster Pound").isVisible());
  ok("eats maps links", (await page.locator('a[href*="maps.apple.com"]').count()) === 20, "title + chip per row, 10 places");
  const townThumbs = page.locator('button img[src*="/spots/"]');
  ok("town spot thumbs", (await townThumbs.count()) === 5, `${await townThumbs.count()} thumbs`);

  // ---- Explore: Park ----
  await page.getByRole("button", { name: "Park", exact: true }).click();
  await page.waitForTimeout(300);
  ok("park spots render", await page.getByText("Great Head Loop").isVisible());
  ok("new spots render", (await page.getByText("Echo Lake Beach").count()) === 1 && (await page.getByText("Bass Harbor Head Lighthouse").count()) === 1 && (await page.getByText("Sand Beach", { exact: true }).count()) === 1);
  const thumbs = page.locator('button img[src*="/spots/"]');
  ok("park spot thumbs", (await thumbs.count()) === 11, `${await thumbs.count()} thumbs`);
  const favs = await page.locator('img[src*="s2/favicons"]').count();
  ok("favicon source icons", favs > 8, `${favs} favicons`);
  await thumbs.first().click();
  await page.waitForTimeout(250);
  ok("photo viewer opens", await page.getByLabel("Close photo").isVisible());
  await page.getByLabel("Close photo").click();
  await page.waitForTimeout(250);
  ok("photo viewer closes", (await page.getByLabel("Close photo").count()) === 0);
  await page.screenshot({ path: `${SHOT_DIR}/3-explore.png`, fullPage: true });

  // ---- Explore: Info ----
  await page.getByRole("button", { name: "Info", exact: true }).click();
  await page.waitForTimeout(300);
  ok("compact map row", await page.getByText("Blackwoods loop map").isVisible());
  await page.getByText("Blackwoods loop map").click();
  await page.waitForTimeout(300);
  ok("map overlay opens", await page.getByLabel("Close map").isVisible());
  ok("map has no caption chrome", (await page.getByText(/pinch to zoom/).count()) === 0);
  await page.getByLabel("Close map").click();
  await page.waitForTimeout(200);
  ok("map overlay closes", (await page.getByLabel("Close map").count()) === 0);
  ok("guides section", await page.getByText("Joe's Guide to Acadia").isVisible());
  ok("route 10 link", (await page.getByText("Island Explorer Route 10 — Blackwoods").count()) === 1);
  const links = await page.locator('a[target="_blank"]').count();
  ok("info links present", links > 15, `${links} anchors`);

  // ---- Packing: grammar + name sheet ----
  await page.getByRole("button", { name: "Packing" }).click();
  await page.waitForTimeout(300);
  // Read the bar rather than hardcode a count — the gear list grows between
  // rounds, and what these check is the transition, not the seed size.
  const claimed = async () => {
    const t = await page.locator("main").getByText(/^\d+ of \d+ claimed$/).first().innerText();
    return parseInt(t, 10);
  };
  ok("claim progress bar", (await claimed()) === 0, `${await claimed()} claimed at rest`);
  ok("no at-rest trash", (await page.getByLabel("Delete", { exact: true }).count()) === 0);

  // Every row is one short phrase now — no must-have tags, no filter pills,
  // and one number on the bar rather than two.
  ok("no must-have tags", (await page.locator("main").getByText("must-have", { exact: true }).count()) === 0);
  ok("no filter pills", (await page.getByRole("button", { name: /^(Unclaimed|Must-haves|Yours|To pack) \d+$/ }).count()) === 0);
  ok("labels say the thing and stop",
    await page.getByText("Firewood — buy on the island").isVisible() &&
    (await page.getByText(/buy local, don't transport/).count()) === 0);
  await page.screenshot({ path: `${SHOT_DIR}/4-packing-group.png`, fullPage: true });

  // whole-row tap with no name -> bottom sheet, action completes after Continue
  await page.getByText("Tarp or canopy").click();
  await page.waitForTimeout(300);
  ok("name sheet opens", (await page.getByRole("button", { name: /^I'm / }).count()) === 11, "the roster leads");
  // Everyone coming is on that list, so typing a name is the exception — left
  // as the default it's how a phantom twelfth person gets invented.
  ok("typing is behind a link", (await page.getByPlaceholder("Your name").count()) === 0);
  ok("unclaimed names read as free",
    (await page.getByRole("button", { name: /already claimed/ }).count()) === 1, "only Alana is taken");
  ok("claim blocked until name", (await claimed()) === 0);
  await page.getByRole("button", { name: "I'm Chris" }).click();
  await page.waitForTimeout(400);
  ok("gated action completed", (await claimed()) === 1);
  ok("claim shows owner name", await page.locator("main").getByText("Chris", { exact: true }).first().isVisible());
  ok("header shows the name", await page.locator("header").getByText("Chris", { exact: true }).isVisible());
  ok("header monogram", await page.locator("header").getByText("C", { exact: true }).isVisible());
  await page.getByLabel("Your profile").click();
  await page.waitForTimeout(300);
  ok("header opens your profile", await page.getByText("choose a photo").isVisible());
  ok("and offers to switch person", await page.getByRole("button", { name: "not you?" }).isVisible());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await page.getByText("Tarp or canopy").click();
  await page.waitForTimeout(250);
  ok("row tap unclaims", (await claimed()) === 0);

  // hierarchy: child renders, claiming the parent claims the bundle
  ok("hierarchy child renders", await page.getByText("Propane \u00d72").isVisible());
  await page.getByText("Camp stove + fuel").click();
  await page.waitForTimeout(300);
  ok("parent claim cascades", (await claimed()) === 2, "the bundle goes with its parent");
  ok("bundle shows owner twice", (await page.locator("main").getByText("Chris", { exact: true }).count()) === 2);
  await page.getByText("Camp stove + fuel").click();
  await page.waitForTimeout(300);
  ok("parent unclaim cascades", (await claimed()) === 0);

  // ghost add per category (pre-filled category, no select)
  ok("no category selects", (await page.locator("select").count()) === 0);
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.keyboard.type("Bug net canopy");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  ok("gear ghost add commits", await page.getByText("Bug net canopy").isVisible());
  await page.keyboard.press("Escape");

  // ---- Packing dnd: vertical mouse drag reorders; drop click is swallowed ----
  const drag = async (fromText, toText, dropAtTop) => {
    await page.getByText(toText).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const src = await page.getByText(fromText).first().boundingBox();
    const dst = await page.getByText(toText).first().boundingBox();
    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
    await page.mouse.down();
    await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2 + 14, { steps: 4 });
    await page.mouse.move(dst.x + dst.width / 2, dropAtTop ? dst.y + 2 : dst.y + dst.height - 2, { steps: 14 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(450);
  };

  await drag("Tarp or canopy", "Tents — spares", true);
  const shelterCard = page.locator("div.mb-5").filter({ has: page.getByText("Shelter", { exact: true }) });
  const shelterTexts = await shelterCard.locator("span.text-\\[14\\.5px\\]").allTextContents();
  ok("dnd reorder within category", shelterTexts[0] === "Tarp or canopy", shelterTexts.join(" | ").slice(0, 90));
  ok("drop click swallowed — nothing claimed", (await claimed()) === 0);

  const fireCard = page.locator("div.mb-5").filter({ has: page.getByText("Fire & Light", { exact: true }) });
  await drag("Bottle opener", "Firewood — buy on the island", true);
  ok("dnd cross-category move", await fireCard.getByText("Bottle opener").isVisible());
  await page.screenshot({ path: `${SHOT_DIR}/5-packing-dnd.png`, fullPage: true });

  // My list
  await page.getByRole("button", { name: "My list" }).click();
  await page.waitForTimeout(300);
  ok("privacy line", await page.getByText("only visible to you").isVisible());
  // The notes that stopped a real mistake survived; the narration didn't.
  ok("the useful notes stayed", await page.getByText("no showers at Blackwoods").isVisible());
  ok("the narration went", (await page.getByText(/the thing first-timers forget/).count()) === 0);
  const packedLine = async () =>
    await page.locator("main").getByText(/^\d+ of \d+ packed$/).first().innerText();
  const listSize = parseInt((await packedLine()).split(" of ")[1], 10);
  ok("progress starts at zero", (await packedLine()) === `0 of ${listSize} packed`, await packedLine());
  await page.getByText("Sleeping bag", { exact: true }).click();
  await page.waitForTimeout(250);
  ok("row tap checks item", (await packedLine()) === `1 of ${listSize} packed`, await packedLine());
  await page.screenshot({ path: `${SHOT_DIR}/6-packing-mine.png`, fullPage: true });

  // checked item sinks to the bottom of its section after ~1s
  const sleepCard = page.locator("div.mb-5").filter({ has: page.getByText("Sleep", { exact: true }) });
  await page.waitForTimeout(1400);
  const sleepTexts = await sleepCard.locator("button").allTextContents();
  ok("checked item sinks", (sleepTexts[sleepTexts.length - 2] || "").includes("Sleeping bag"), sleepTexts.join(" | ").slice(0, 80));

  // ---- Ideas: own card edit (name is set now, so no gate) ----
  await page.getByRole("button", { name: "Itinerary" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Add yours" }).click();
  await page.waitForTimeout(250);
  ok("ideas editor opens with chips", await page.getByRole("button", { name: "A big hike" }).isVisible());
  ok("ideas placeholders", (await page.getByPlaceholder("s'mores night, a dish, allergies…").count()) === 1);
  await page.getByRole("button", { name: "A big hike" }).click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Swimming" }).click();
  await page.waitForTimeout(150);
  await page.getByRole("button", { name: "Wander, no plan" }).click();
  await page.waitForTimeout(200);
  // `bar_harbor` — camping experience — was only ever exercised through the
  // intro questionnaire, so removing that left the column with no coverage at
  // all. The Ideas editor is its only home now.
  await page.getByRole("button", { name: "First timer" }).click();
  await page.waitForTimeout(150);
  await page.getByPlaceholder("s'mores night, a dish, allergies…").fill("Breakfast burritos");
  await page.getByPlaceholder("anything you're hoping to do or see…").fill("Great Head sunrise");
  await page.screenshot({ path: `${SHOT_DIR}/7-ideas-edit.png`, fullPage: true });
  await page.getByRole("heading", { name: "Acadia Base Camp" }).click();
  await page.waitForTimeout(300);
  ok("vibes saved to card", await page.getByText("A big hike · Swimming", { exact: true }).isVisible());
  ok("idea card saved on tap-away", await page.getByText("Great Head sunrise").isVisible());
  ok("pace chips on cards", (await page.getByText("Wander, no plan").count()) === 1 && (await page.getByText("One good hike").count()) === 1, "mine + Alana");
  ok("camped-before saves from ideas", await page.getByText("First timer").isVisible());
  ok("vibe tally", await page.getByText(/a big hike \u00d72/).isVisible());
  ok("ideas editor closed", (await page.locator('input[placeholder*="allergies"]').count()) === 0);

  // reopen own card: explicit Done commit
  await page.getByText("Great Head sunrise").click();
  await page.waitForTimeout(250);
  await page.getByPlaceholder("s'mores night, a dish, allergies…").fill("Breakfast burritos + hot sauce");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(300);
  ok("done button commits", await page.getByText("Breakfast burritos + hot sauce").isVisible());
  ok("done closes editor", (await page.locator('input[placeholder*="allergies"]').count()) === 0);

  // ---- Food: a menu you vote on, and a list you can shop ----
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await page.waitForTimeout(300);
  // The vote page is the ballots and nothing else: no requests card, no
  // catch-all add row, no list of what's already being bought.
  ok("nothing but the ballots", (await page.getByText("Requests").count()) === 0
    && (await page.getByText("Want something specific?").count()) === 0
    && (await page.getByText("Already on the list").count()) === 0);

  // ---- two questions, not nine ----
  // Nine meal slots and twenty-seven dishes asked eleven people to hold an
  // opinion about Sunday's oatmeal. One vote came back in three days.
  const ballot = await page.locator("main").getByRole("button", { name: /^Vote for / }).count();
  ok("the ballot is short", ballot === 8, `${ballot} options`);
  ok("friday dinner is a question", await page.getByText("Friday dinner").isVisible());
  ok("saturday breakfast is a question", await page.getByText("Saturday breakfast").isVisible());
  ok("nothing else is", (await page.locator("main").getByText(/^(Sunday|Anytime) /).count()) === 0);
  // Not voting on something doesn't mean not buying it.
  // Every dish is built vegetarian with the meat added at the end, so a
  // per-dish "veg" badge stopped meaning anything. The rule is stated once.
  ok("no per-dish veg badges", (await page.locator("main").getByText("veg", { exact: true }).count()) === 0);
  // Nothing on the ballot needs an oven or a toaster.
  // Five options are a starting point, not the whole menu — anyone can put a
  // sixth on the same ballot.
  ok("every ballot takes a suggestion", (await page.getByRole("button", { name: /Suggest another/ }).count()) === 2);
  const friday = page.locator("div.mb-5").filter({ has: page.getByText("Friday dinner", { exact: true }) });
  await friday.getByRole("button", { name: /Suggest another/ }).click();
  await page.keyboard.type("Grilled cheese");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  ok("a suggested dish joins the ballot", await friday.getByRole("button", { name: "Vote for Grilled cheese" }).isVisible());
  // And swipes back off it — the trash can was buried in the editor.
  await swipeRow(friday.getByRole("button", { name: "Vote for Grilled cheese" }));
  ok("a dish swipes off the ballot", (await page.getByText("Grilled cheese").count()) === 0);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(400);
  ok("undo puts the dish back", await friday.getByText("Grilled cheese").isVisible());
  await swipeRow(friday.getByRole("button", { name: "Vote for Grilled cheese" }));
  await page.waitForTimeout(300);

  ok("nothing uncookable on the ballot",
    (await page.getByText("Pizza").count()) === 0 &&
    (await page.getByText(/toast/i).count()) === 0 &&
    (await page.getByText(/cornbread/i).count()) === 0);
  ok("no leader before a vote", (await page.locator("main").getByText("leading", { exact: true }).count()) === 0);

  // Tapping a dish used to open the editor, which made voting fiddly. The whole
  // row votes now; editing moved behind the pencil.
  await page.getByRole("button", { name: "Vote for Taco bar" }).click();
  await page.waitForTimeout(350);
  ok("row tap votes", (await page.getByRole("button", { name: "Remove your vote for Taco bar" }).count()) === 1);
  ok("row tap opens no editor", (await page.locator('input[value="Taco bar"]').count()) === 0);
  ok("a vote crowns a leader", (await page.locator("main").getByText("leading", { exact: true }).count()) >= 1);
  // ...and voting twice quickly is what raised "couldn't save — retry": both
  // taps read "not voted yet" off a stale render and both INSERTed.
  await page.getByRole("button", { name: "Remove your vote for Taco bar" }).click();
  await page.getByRole("button", { name: "Vote for Taco bar" }).click();
  await page.waitForTimeout(500);
  ok("fast re-vote raises no error", (await page.getByText("Couldn't save").count()) === 0);
  ok("fast re-vote leaves one vote", (await page.getByRole("button", { name: "Remove your vote for Taco bar" }).count()) === 1);

  await page.getByRole("button", { name: "Edit Pancakes + bacon" }).click();
  await page.waitForTimeout(300);
  ok("pencil opens the editor", (await page.locator('input[value="Pancakes + bacon"]').count()) === 1);
  await page.getByRole("button", { name: "Add ingredient" }).click();
  await page.keyboard.type("Blueberries");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  await page.keyboard.press("Escape");
  // Pancakes is losing to nothing yet, so its ingredients aren't being bought.
  ok(
    "an unplanned dish warns its ingredients won't ship",
    await page.getByText(/stays? off the store list|stay off the store list/).isVisible(),
  );
  await page.screenshot({ path: `${SHOT_DIR}/8-food-dish-ingredients.png`, fullPage: true });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(300);
  ok("no ingredient byline under the dish", (await page.getByText(/\d\/\d ingredients/).count()) === 0);

  // ---- the list is what the votes decided, plus what people asked for ----
  await page.getByRole("button", { name: "List", exact: true }).click();
  await page.waitForTimeout(300);
  ok("the winner's ingredients are on it", await page.getByText("Taco seasoning").first().isVisible());
  ok(
    "the loser's are not",
    (await page.getByText("Blueberries").count()) === 0,
  );
  // The trail lunch nobody voted on is bought all the same.
  ok("what isn't voted on is still bought", await page.getByText("Deli turkey").first().isVisible());
  // Grouped by where things sit in a shop, not by where the row came from.
  ok("list groups by aisle", await page.locator("main").getByText("Meat + Deli", { exact: true }).isVisible());
  ok("rows are tagged with their dish", await page.getByText(/Taco bar · Friday/).first().isVisible());

  // Tortillas belong to two dishes on the plan. You buy tortillas once.
  const tortillaRows = await page.locator("main").getByText(/^Tortillas$/).count();
  ok("one line per thing in the cart", tortillaRows === 1, `${tortillaRows} tortilla lines`);

  // No invented amounts anywhere on the seeded list — checked before anything
  // is typed by hand, since a person may well write "×4" and that's theirs.
  const numbered = await page.locator("main").getByText(/^[A-Z][^·]*\s(×\d|\d+\s?(lb|oz))/).count();
  ok("no quantities on the list", numbered === 0, `${numbered} numbered lines`);

  // Every heading takes an add of its own, and what you add stays under the
  // heading you tapped rather than wherever the words would have sent it.
  const produce = page.locator("div.mb-5").filter({ has: page.getByText("Produce", { exact: true }) });
  await produce.getByRole("button", { name: "Add", exact: true }).click();
  await page.keyboard.type("Bananas");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  await page.keyboard.press("Escape");
  ok("added under a heading, stays there", await produce.getByText("Bananas").isVisible());
  ok("and it says who wanted it", await produce.getByText("Chris", { exact: true }).first().isVisible());

  // "Ice ×4" would classify into Ice + Frozen on its own; typed under Produce
  // it stays under Produce.
  await produce.getByRole("button", { name: "Add", exact: true }).click();
  await page.keyboard.type("Ice ×4");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  await page.keyboard.press("Escape");
  ok("a pinned aisle beats the classifier", await produce.getByText("Ice ×4").isVisible());

  // Every line swipes away now, not just the hand-added ones — a menu
  // ingredient you've decided against is exactly as removable.
  await swipeRow(page.getByText("Taco seasoning").first());
  ok("a menu ingredient swipes away too", (await page.getByText("Taco seasoning").count()) === 0);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(400);
  ok("and undo brings it back", await page.getByText("Taco seasoning").first().isVisible());
  // No running count on the tab — it read as a target nobody set.
  ok("the tab is just List", (await page.getByRole("button", { name: /left$/ }).count()) === 0);
  await page.getByText("Taco seasoning").first().click();
  await page.waitForTimeout(350);
  // Ticking a line is a claim: you got it, so your name goes on it.
  ok("a ticked line says who got it", await page.getByText("Chris got it").first().isVisible());
  await page.screenshot({ path: `${SHOT_DIR}/9-food-store.png`, fullPage: true });

  await page.getByRole("button", { name: "Vote", exact: true }).click();
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "Edit Taco bar" }).click();
  await page.waitForTimeout(300);
  ok(
    "a tick in the aisle syncs into the dish",
    (await page.locator("div.bg-\\[\\#FBF8EE\\] .line-through").count()) === 1,
  );
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(250);

  // ---- Expenses: split it, then settle up ----
  // Expenses left Food for its own tab: deciding what to eat and working out
  // who owes whom are different jobs on different days.
  ok("five tabs", (await page.locator("nav.fixed.bottom-0 > button").count()) === 5);
  await page.getByRole("button", { name: "Expenses", exact: true }).click();
  await page.waitForTimeout(300);
  ok("expenses empty state", await page.getByText(/Nothing logged yet/).isVisible());
  // Everyone already knows who's coming, so the roster stopped earning a card
  // on the page — but a wrong name still has to be fixable.
  ok("no roster card on the page",
    (await page.locator("main").getByText("Alana", { exact: true }).count()) === 0);
  await page.getByRole("button", { name: /^\d+ on the trip$/ }).click();
  await page.waitForTimeout(350);
  const roster = page.locator("div.fixed.inset-0.z-50");
  ok("roster is one tap away", (await roster.getByText("Alana", { exact: true }).count()) === 1);
  // The name typed into the gate sheet earlier was already on the roster, so it
  // resolved to that person instead of minting a second Chris. That is the whole
  // reason the arithmetic below can be trusted.
  ok("typing a roster name doesn't duplicate the person",
    (await roster.getByText("Chris", { exact: true }).count()) === 1);
  ok("you are marked on the roster",
    (await roster.getByText("you", { exact: true }).count()) === 1);
  await roster.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(300);

  // A mis-tap should be a two-tap fix, not a text to Chris — and it lives with
  // your photo now, behind the header avatar.
  await page.getByLabel("Your profile").click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "not you?" }).click();
  await page.waitForTimeout(250);
  ok("switching person offers the others",
    (await page.getByRole("button", { name: /^I'm / }).count()) === 10, "everyone but you");
  // Taking a name that's already on a phone asks instead of stealing it.
  await page.getByRole("button", { name: "I'm Alana (already claimed)" }).click();
  await page.waitForTimeout(250);
  ok("claimed name asks before taking it",
    await page.getByText(/already set up on a phone/).isVisible());
  await page.getByRole("button", { name: "Pick again" }).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Never mind" }).click();
  await page.waitForTimeout(250);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  ok("switching is cancellable",
    await page.locator("header").getByText("Chris", { exact: true }).isVisible());

  // Paid by you, split with everyone — the common case, no extra taps.
  await page.getByRole("button", { name: "Add an expense" }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder("What you bought").fill("Groceries at Hannaford");
  await page.getByLabel("Amount").fill("243.50");
  ok("payer defaults to you",
    (await page.getByRole("button", { name: "Chris paid" }).getAttribute("aria-pressed")) === "true");
  ok("split defaults to everyone", await page.getByText("Everyone", { exact: true }).isVisible());
  // The division is visible while you type it, so a wrong amount is obvious
  // before it's saved rather than after the settle-up looks odd.
  ok("per-head shown as you type", await page.getByText("$22.14 each · 11 people").isVisible());
  // A receipt can be attached before the expense exists — you photograph it
  // while adding, not after saving and reopening.
  await page.setInputFiles('input[type="file"]', {
    name: "receipt.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG,
  });
  await page.waitForTimeout(300);
  ok("receipt attaches to an unsaved expense",
    (await page.getByRole("button", { name: "View receipt" }).count()) === 1);
  await page.screenshot({ path: `${SHOT_DIR}/10-expenses-editor.png`, fullPage: true });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(500);
  ok("row says who paid and how it split",
    await page.getByText("Chris paid · split with everyone").isVisible());
  ok("the receipt went up with it", (await page.locator('img[src^="blob:"]').count()) >= 1);
  // $243.50 across eleven leaves seven odd cents, handed out in roster order;
  // Chris sorts fifth so he carries one, and 221.36 rather than 221.37 is the
  // split reconciling to the penny.
  ok("balance says you're owed", await page.getByText("You're owed").isVisible());
  ok("owed to the cent", await page.getByText("$221.36").first().isVisible());

  // Someone else pays, split among a subset that leaves you out.
  await page.getByRole("button", { name: "Add an expense" }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder("What you bought").fill("Lobster rolls");
  await page.getByLabel("Amount").fill("42.25");
  await page.getByRole("button", { name: "Erin paid" }).click();
  await page.getByRole("button", { name: "change" }).click();
  await page.waitForTimeout(350);
  const sheet = page.locator("div.fixed.inset-0.z-50");
  // The old control flipped its label to "none" once everyone was selected,
  // which read as the opposite of what it did. Both shortcuts are their own
  // button now and always say the same thing.
  ok("everyone shortcut is always Everyone",
    await sheet.getByRole("button", { name: "Everyone" }).isVisible());
  ok("solo shortcut names the payer",
    await sheet.getByRole("button", { name: "Just Erin" }).isVisible());
  await page.screenshot({ path: `${SHOT_DIR}/10b-split-picker.png` });
  await sheet.getByRole("button", { name: "Just Erin" }).click();
  await sheet.getByRole("button", { name: "Include Patrick" }).click();
  await page.waitForTimeout(200);
  ok("picker updates the summary line", await page.getByText("Erin and Patrick").isVisible());
  await sheet.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(400);
  ok("a subset split charges only those people",
    await page.getByText(/split 2 ways · not you/).isVisible());

  // The settle-up is the point: these payments must clear the ledger exactly.
  // One person paying for everything is ten rows, so the card shows three until
  // asked for the rest.
  ok("long settle lists are capped",
    (await page.locator("[data-settle]").count()) === 3, "three of ten");
  await page.getByRole("button", { name: /^show all \d+ payments$/ }).click();
  await page.waitForTimeout(250);
  const settleCents = await page
    .locator("[data-settle]")
    .evaluateAll((els) => els.map((e) => Number(e.dataset.settle)));
  ok("settle-up pays off exactly what you're owed",
    settleCents.reduce((a, b) => a + b, 0) === 22136, `${settleCents}`);
  ok("one payment per debtor", settleCents.length === 10, `${settleCents.length}`);
  await page.screenshot({ path: `${SHOT_DIR}/10c-expenses-settle.png`, fullPage: true });

  // Settling has to move the numbers, or the same debts sit there all trip.
  // Venmo is how this group actually pays each other, so the link carries the
  // amount and — when the roster has it — the handle.
  await page.locator("[data-settle]").first().getByRole("button").click();
  await page.waitForTimeout(250);
  const payHref = await page
    .locator('a[href*="venmo.com"]')
    .first()
    .getAttribute("href");
  const pay = new URL(payHref);
  ok("venmo link opens a payment", pay.searchParams.get("txn") === "charge",
    "you're owed, so it's a request");
  ok("venmo link carries the amount",
    /^\d+\.\d\d$/.test(pay.searchParams.get("amount") ?? ""), `${pay.searchParams.get("amount")}`);

  const owedBefore = settleCents.reduce((a, b) => a + b, 0);
  const firstPayment = settleCents[0];
  await page.getByRole("button", { name: "Mark paid" }).first().click();
  await page.waitForTimeout(450);
  const afterCents = await page
    .locator("[data-settle]")
    .evaluateAll((els) => els.map((e) => Number(e.dataset.settle)));
  ok("marking paid clears that row", afterCents.length === settleCents.length - 1,
    `${settleCents.length} → ${afterCents.length}`);
  ok("and takes it off what you're owed",
    afterCents.reduce((a, b) => a + b, 0) === owedBefore - firstPayment);
  ok("the payment is logged", await page.getByText("Already paid back").isVisible());

  // A wrong entry has to be reversible — it's money.
  const settledRow = page.locator("main").getByText(/paid Chris$/).first();
  await swipeRow(settledRow);
  ok("a settlement can be swiped away", (await page.getByText("Already paid back").count()) === 0);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(450);
  ok("undo puts it back", await page.getByText("Already paid back").isVisible());

  // Removing someone mid-ledger would rewrite everyone's balance without saying
  // so, so it's refused while they're on an expense or a payment.
  await page.getByRole("button", { name: /^\d+ on the trip$/ }).click();
  await page.waitForTimeout(350);
  const roster2 = page.locator("div.fixed.inset-0.z-50");
  await swipeRow(roster2.getByRole("button", { name: /Erin/ }).first());
  ok("can't remove someone who's on an expense",
    await page.getByText(/Erin is on \d row/).isVisible());
  ok("they're still on the roster",
    (await roster2.getByText("Erin", { exact: true }).count()) >= 1);
  await roster2.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(300);

  // Editing goes through the same form; deleting an expense undoes cleanly.
  await page.getByText("Lobster rolls").click();
  await page.waitForTimeout(300);
  ok("tapping a row opens the editor",
    (await page.getByRole("button", { name: "Delete expense" }).count()) === 1);
  await page.getByRole("button", { name: "Delete expense" }).click();
  await page.waitForTimeout(300);
  ok("expense deleted", (await page.getByText("Lobster rolls").count()) === 0);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(500);
  ok("undo restores the expense and its split",
    await page.getByText(/split 2 ways · not you/).isVisible());

  // An expense split with nobody would never reach the settle-up — `balances`
  // skips it, so the payer is silently never paid back while the amount still
  // counts toward what the group spent. The editor refuses to write one.
  const settleTotal = async () =>
    (await page.locator("[data-settle]").evaluateAll((els) =>
      els.map((e) => Number(e.dataset.settle)))).reduce((a, b) => a + b, 0);
  const beforeGhost = await settleTotal();
  await page.getByRole("button", { name: "Add an expense" }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder("What you bought").fill("Bag of ice");
  await page.getByLabel("Amount").fill("6.00");
  await page.getByRole("button", { name: "change" }).click();
  await page.waitForTimeout(350);
  const ghostSheet = page.locator("div.fixed.inset-0.z-50");
  // Deselect everyone by toggling off the two the solo shortcut leaves on.
  await ghostSheet.getByRole("button", { name: "Everyone" }).click();
  await page.waitForTimeout(150);
  for (const n of ["Alana", "Alexis", "Ariana", "Ashley", "Chris", "Erin",
                   "Irene", "Mayank", "Molida", "Patrick", "Sng"]) {
    const off = ghostSheet.getByRole("button", { name: `Leave out ${n}` });
    if (await off.count()) await off.click();
  }
  await page.waitForTimeout(200);
  ok("the picker can reach nobody",
    (await ghostSheet.getByRole("button", { name: /^Include / }).count()) === 11);
  await ghostSheet.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(400);
  ok("a split with nobody is refused", await page.getByText("Pick who this was for").isVisible());
  ok("the editor stays open to fix it",
    (await page.getByPlaceholder("What you bought").count()) === 1);
  ok("nothing was written", (await page.getByText("Bag of ice").count()) === 0);
  ok("the ledger is untouched", (await settleTotal()) === beforeGhost, `${await settleTotal()}`);
  // Picking someone lets the same expense through.
  await page.getByRole("button", { name: "change" }).click();
  await page.waitForTimeout(350);
  await ghostSheet.getByRole("button", { name: "Everyone" }).click();
  await ghostSheet.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(400);
  ok("picking someone lets it through", await page.getByText("Bag of ice").isVisible());

  // Emptying the description is an edit like any other — silently keeping the
  // old text is worse than a row that says nothing.
  await page.getByText("Bag of ice").click();
  await page.waitForTimeout(300);
  ok("a row opens its detail, not the editor",
    (await page.getByPlaceholder("What you bought").count()) === 0);
  ok("detail shows who it was split with",
    await page.getByText(/each · \d+ people?$/).isVisible());
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder("What you bought").fill("");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.waitForTimeout(400);
  ok("a cleared description sticks", (await page.getByText("Bag of ice").count()) === 0);
  ok("the row is still there, unnamed", await page.getByText("Untitled").isVisible());

  // Undo of a removal must put the person back under their original id. Adding
  // them again by name would mint a new one, and the devices the delete just
  // unlinked would stay unlinked — one person quietly becoming two. The tell is
  // the "you" marker: it only renders on the member this device is linked to,
  // so it comes back if and only if the id survived.
  const openRoster = async () => {
    await page.getByRole("button", { name: /^\d+ on the trip$/ }).click();
    await page.waitForTimeout(350);
    return page.locator("div.fixed.inset-0.z-50");
  };
  const closeRoster = async (sheet) => {
    await sheet.getByRole("button", { name: "Done", exact: true }).click();
    await page.waitForTimeout(300);
  };
  const meMarker = async () => {
    const sheet = await openRoster();
    const n = await sheet.getByText("you", { exact: true }).count();
    await closeRoster(sheet);
    return n;
  };
  ok("you are marked before any of this", (await meMarker()) === 1);

  // Clear the ledger first — removing someone mid-ledger is refused, by design.
  for (const desc of ["Untitled", "Groceries at Hannaford", "Lobster rolls"]) {
    const row = page.getByText(desc, { exact: true });
    if (!(await row.count())) continue;
    await row.first().click();
    await page.waitForTimeout(250);
    await page.getByRole("button", { name: "Delete expense" }).first().click();
    await page.waitForTimeout(350);
  }
  ok("the ledger is empty again", await page.getByText(/Nothing logged yet/).isVisible());

  // A recorded payment pins both of its members exactly like an expense does,
  // so it has to go before anyone can leave the roster.
  await swipeRow(page.locator("main").getByText(/paid Chris$/).first());
  await page.waitForTimeout(300);
  ok("no payments left either", (await page.getByText("Already paid back").count()) === 0);

  const rosterSheet = await openRoster();
  await swipeRow(rosterSheet.getByRole("button", { name: /Chris/ }).first());
  ok("someone on no expense can be removed",
    (await rosterSheet.getByText("Chris", { exact: true }).count()) === 0);
  await closeRoster(rosterSheet);
  ok("and the you marker goes with them", (await meMarker()) === 0);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(600);
  const rosterBack = await openRoster();
  ok("undo puts them back exactly once",
    (await rosterBack.getByText("Chris", { exact: true }).count()) === 1);
  await closeRoster(rosterBack);
  ok("undo restores the same person, not a namesake", (await meMarker()) === 1);

  // ---- the page must never pan sideways ----
  // Carousels scroll horizontally; the document must not. A stray absolutely
  // positioned child escaping a carousel widens the document and lets a sideways
  // swipe drag the whole app off-screen.
  for (const tab of ["Itinerary", "Packing", "Food", "Expenses", "Explore"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await page.waitForTimeout(400);
    const w = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    ok(`${tab} does not scroll sideways`, w.scroll <= w.client, `${w.scroll} > ${w.client}`);
  }
  await page.getByRole("button", { name: "Itinerary", exact: true }).click();
  await page.waitForTimeout(400);
  ok("carousels contain their overscroll",
    (await page.locator(".overflow-x-auto.overscroll-x-contain").count()) === 2);

  // ---- persistence: reload lands on the schedule; segments restore per tab ----
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: "List", exact: true }).click();
  await page.waitForTimeout(250);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  ok("reload lands on schedule", await page.getByText("Camp setup", { exact: true }).isVisible());
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await page.waitForTimeout(300);
  ok("food segment restored", await page.locator("main").getByText("Bakery", { exact: true }).isVisible());
  // A phone that visited before Expenses moved out still has "money" stored;
  // without a fallback the Food tab renders blank on that phone forever.
  await page.evaluate(() => sessionStorage.setItem("abc.foodView", "money"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Food", exact: true }).click();
  await page.waitForTimeout(300);
  ok("stale money segment falls back to the menu", await page.getByText("Taco bar", { exact: true }).isVisible());

  // ---- intro replay from Explore + ?welcome=1 + PWA endpoints ----
  await page.getByRole("button", { name: "Explore" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Info", exact: true }).click();
  await page.waitForTimeout(250);
  await page.getByText("replay the intro").click();
  await page.waitForTimeout(300);
  ok("replay shows intro", await page.getByText("TAP YOUR NAME").isVisible());
  await page.getByText("skip for now").click();
  await page.waitForTimeout(300);
  ok("replay exits to app", await page.getByRole("heading", { name: "Acadia Base Camp" }).isVisible());
  await page.goto(BASE + "/?welcome=1", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  ok("welcome=1 forces intro", await page.getByText("TAP YOUR NAME").isVisible());
  const man = await page.request.get(BASE + "/manifest.webmanifest");
  ok("manifest served", man.status() === 200 && (await man.json()).name === "Acadia Base Camp");
  const ai = await page.request.get(BASE + "/apple-icon.png");
  ok("apple icon served", ai.status() === 200);

  // ---- Welcome: first-open flow in a fresh context (no welcomed flag) ----
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE, { waitUntil: "networkidle" });
  await p2.waitForTimeout(1200);
  ok("welcome shows on first visit", await p2.getByText("TAP YOUR NAME").isVisible());
  await p2.screenshot({ path: `${SHOT_DIR}/11-welcome.png` });
  // Chris: the first screen is the trip's name, when and where, and which of us
  // you are. Everything that used to sit around that is gone.
  ok("intro leads with the roster", (await p2.getByRole("button", { name: /^I'm / }).count()) === 11);
  ok("no party count line", (await p2.getByText(/of us · 2 sites/).count()) === 0);
  ok("no photo circle on screen one", (await p2.getByLabel("Add a photo").count()) === 0);
  ok("no questionnaire behind it", (await p2.getByText("What kind of weekend?").count()) === 0);
  // The list is the whole party, so typing is the exception behind a link.
  ok("typing is behind a link", (await p2.getByPlaceholder("Your name").count()) === 0);
  await p2.getByRole("button", { name: "not on the list?" }).click();
  await p2.waitForTimeout(250);
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.waitForTimeout(200);
  ok("continue blocked without name", await p2.getByText("TAP YOUR NAME").count() === 0 &&
    (await p2.getByPlaceholder("Your name").count()) === 1, "still on the text field");
  await p2.getByPlaceholder("Your name").fill("Robin");
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.waitForTimeout(400);

  // Step two is the photo, and nothing else.
  ok("name lands on the photo step", await p2.getByRole("heading", { name: "Add a photo" }).isVisible());
  ok("greets by name", await p2.getByText("Hey Robin").isVisible());
  await p2.screenshot({ path: `${SHOT_DIR}/12-photo.png` });
  await p2.setInputFiles('input[type="file"]', { name: "me.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG });
  await p2.waitForTimeout(400);
  ok("crop frame appears", await p2.getByText("pinch and drag to frame it").isVisible());
  await p2.getByRole("button", { name: "Save" }).click();
  await p2.waitForTimeout(700);
  ok("save lands in app", await p2.getByRole("heading", { name: "Acadia Base Camp" }).isVisible());
  ok("name saved — header shows it", await p2.locator("header").getByText("Robin", { exact: true }).isVisible());
  ok("header shows avatar", (await p2.locator("header img").count()) === 1);

  // The questions moved to the Ideas board, which already edits all five.
  ok("ideas board invites the answers", await p2.getByRole("button", { name: "Add yours" }).isVisible());

  // A replay is for changing your mind, not introducing yourself.
  await p2.getByRole("button", { name: "Explore" }).click();
  await p2.waitForTimeout(300);
  await p2.getByRole("button", { name: "Info", exact: true }).click();
  await p2.waitForTimeout(250);
  await p2.getByText("replay the intro").click();
  await p2.waitForTimeout(400);
  ok("replay prefills name", (await p2.getByPlaceholder("Your name").inputValue()) === "Robin");
  ok("replay offers the list too", await p2.getByRole("button", { name: "back to the list" }).isVisible());
  await p2.getByRole("button", { name: "Continue" }).click();
  await p2.waitForTimeout(400);
  await p2.getByText("skip", { exact: true }).click();
  await p2.waitForTimeout(400);
  ok("replay exits without touching the photo", (await p2.locator("header img").count()) === 1);

  await p2.reload({ waitUntil: "networkidle" });
  await p2.waitForTimeout(900);
  ok("welcome not shown again", (await p2.getByText("TAP YOUR NAME").count()) === 0);
  await ctx2.close();

  // skip path
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p3 = await ctx3.newPage();
  await p3.goto(BASE, { waitUntil: "networkidle" });
  await p3.waitForTimeout(600);
  await p3.getByText("skip for now").click();
  await p3.waitForTimeout(300);
  ok("skip lands in app", await p3.getByRole("heading", { name: "Acadia Base Camp" }).isVisible());
  await ctx3.close();

  await browser.close();
  const fails = results.filter((r) => !r.pass);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error("SCRIPT ERROR:", e);
  process.exit(2);
});
