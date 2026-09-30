/**
 * Post-build smoke test.
 *
 * Boots the production server and asserts that every route returns 200 and that
 * key user-facing copy is actually present in the rendered HTML.
 *
 * `next build` succeeding is not enough: an element can disappear from the
 * output while the build stays green (a server component whose child gets
 * deferred to an RSC chunk that never lands, for example). This catches that.
 *
 * No browser needed — it reads the server-rendered HTML directly.
 *
 *   node scripts/smoke.mjs [--port 3210]
 */

import { spawn } from "node:child_process";
import { createServer as createHttpServer } from "node:http";
import { createServer } from "node:net";

/** Ask the OS for a free port so a stray dev server can't shadow this run. */
function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

const portArg = process.argv.indexOf("--port");
const PORT = portArg !== -1 ? Number(process.argv[portArg + 1]) : await freePort();
const BASE = `http://127.0.0.1:${PORT}`;

/** Copy that must survive into the rendered HTML for each route. */
const ROUTES = [
  {
    path: "/",
    expect: [
      "The right room",
      "Find your next event",
      "See past recaps",
      "Talk with Andrew",
      "Send a message",
      "A connector by nature.",
      // Desktop site chrome — the nav and footer render server-side on every route.
      "Sponsorship",
      "Explore",
      "Get in touch",
      "All rights reserved",
      // Link previews. The absolute host matters as much as the image: a
      // metadataBase pointing at a domain this app doesn't serve makes every
      // card come up blank. Neither NEXT_PUBLIC_SITE_URL nor Vercel's
      // VERCEL_PROJECT_PRODUCTION_URL is set in CI, so this is the fallback
      // baked in at build time.
      "https://mmg-app-pwa.vercel.app/assets/brand/social-card.jpg",
      "summary_large_image",
    ],
  },
  {
    path: "/events",
    expect: [
      "Come meet the personal injury community.",
      "Follow MMG on Eventbrite",
      "Photo recaps",
      // Proves the marketing-site feed reached the page, not just that it rendered.
      "Fall Personal Injury Professionals Mixer",
    ],
  },
  { path: "/events/past", expect: ["The flyer starts the invitation."] },
  // Slugs come from the marketing site's feed. These two are asserted by name
  // so a feed change that silently empties the calendar fails the build rather
  // than shipping an app with no events in it.
  {
    // RSVP / Add to calendar only render while an event is upcoming, so they
    // are asserted on whichever event is next (checkUpcomingRsvp), not here —
    // pinning them to a dated event failed the build the day after it ran.
    path: "/events/fall-personal-injury-professionals-mixer",
    expect: [
      "Open in Maps",
      "Who&#x27;s coming",
      "JOEY Aventura",
      // The Talk tab is the server-backed guest discussion, footer included.
      "Guest discussion",
      "Powered by Coach OS",
    ],
  },
  {
    path: "/events/seed-bowling-mixer",
    expect: ["Lucky Strike", "Sponsor a future event"],
  },
  {
    path: "/sponsor",
    expect: [
      "Select Community Partner",
      "Select Featured Sponsor",
      "Select Presenting Partner",
      "561-888-9450",
      // A real sponsor from the live feed.
      "The MRI Guys",
    ],
  },
  { path: "/discuss", expect: ["Open discussions", "Talking about specific events"] },
  { path: "/discuss/thread-first-event-advice", expect: ["Add your reply", "Discussion"] },
  {
    path: "/contact",
    expect: ["Send request", "Email MMG", "Reset my activity", "contact@millersmarketinggroup.com"],
  },
  { path: "/offline", expect: ["Back to home"] },
  { path: "/manifest.webmanifest", expect: ['"short_name": "MMG"', '"display": "standalone"'] },
  { path: "/sw.js", expect: ["mmg-v1", "/offline"] },
];

/** Static assets that must exist for the PWA install to work. */
const ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/assets/brand/mmg-official-logo.webp",
  "/assets/brand/social-card.jpg",
];

const failures = [];

/**
 * Refuse to test against something we didn't start. Without this, a stale
 * server left on the port answers happily and the whole suite passes against
 * a stale build — worse than no test at all.
 */
async function assertPortFree() {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(1500) });
  } catch {
    return; // Nothing listening, which is what we want.
  }
  throw new Error(`Something is already serving ${BASE}. Stop it and re-run.`);
}

async function waitForServer(child, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`next start exited early with code ${child.exitCode}`);
    }
    try {
      const res = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start on ${BASE} within ${timeoutMs}ms`);
}

async function checkRoute({ path, expect }) {
  const res = await fetch(BASE + path);
  if (!res.ok) {
    failures.push(`${path} -> HTTP ${res.status}`);
    return;
  }
  const body = await res.text();
  const missing = expect.filter((needle) => !body.includes(needle));
  if (missing.length) {
    failures.push(`${path} -> missing copy: ${missing.map((m) => JSON.stringify(m)).join(", ")}`);
  } else {
    console.log(`  ok  ${path}`);
  }
}

/**
 * The mail relay's contract, exercised without sending anything.
 *
 * Each case here resolves before the route ever reaches Resend, so it behaves
 * identically in CI (no RESEND_API_KEY) and in production.
 */
async function checkContactApi() {
  const post = (body) =>
    fetch(`${BASE}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  const cases = [
    ["rejects malformed JSON", () => post("{nope"), 400],
    ["rejects a missing subject", () => post({ fields: { Name: "A" } }), 400],
    ["rejects missing fields", () => post({ subject: "Hi" }), 400],
    ["rejects empty fields", () => post({ subject: "Hi", fields: {} }), 400],
    [
      "swallows the honeypot",
      () => post({ subject: "Hi", fields: { Name: "Bot" }, website: "spam" }),
      200,
    ],
    ["rejects GET", () => fetch(`${BASE}/api/contact`), 405],
  ];

  for (const [label, run, expected] of cases) {
    const res = await run();
    if (res.status !== expected) {
      failures.push(`/api/contact ${label} -> expected ${expected}, got ${res.status}`);
    } else {
      console.log(`  ok  /api/contact ${label}`);
    }
  }
}

async function checkAsset(path) {
  const res = await fetch(BASE + path);
  if (!res.ok || Number(res.headers.get("content-length") ?? 1) === 0) {
    failures.push(`${path} -> HTTP ${res.status}`);
  } else {
    console.log(`  ok  ${path}`);
  }
}

// ---------------------------------------------------------------------------
// Guest discussions + GoHighLevel
// ---------------------------------------------------------------------------

const ADMIN_TOKEN = "smoke-admin-token";

/**
 * Stand-ins for the two outside services, so the GHL path can be proven end to
 * end without credentials: a Redis REST endpoint (what Vercel's Upstash store
 * speaks) that outlives a server restart, and a GoHighLevel API that records
 * what it was sent.
 */
function listen(handler) {
  return new Promise((resolve) => {
    const server = createHttpServer(async (req, res) => {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const reply = await handler(req, raw ? JSON.parse(raw) : undefined);
      res.writeHead(reply.status ?? 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(reply.body ?? {}));
    });
    server.listen(0, "127.0.0.1", () =>
      resolve({ server, url: `http://127.0.0.1:${server.address().port}` }),
    );
  });
}

const redis = { values: new Map(), lists: new Map() };
const kv = await listen((_req, command) => {
  const [op, key, ...args] = command;
  const list = () => redis.lists.get(key) ?? [];
  switch (op) {
    case "GET":
      return { body: { result: redis.values.get(key) ?? null } };
    case "SET": {
      if (args.includes("NX") && redis.values.has(key)) return { body: { result: null } };
      redis.values.set(key, args[0]);
      return { body: { result: "OK" } };
    }
    case "DEL":
      redis.values.delete(key);
      redis.lists.delete(key);
      return { body: { result: 1 } };
    case "RPUSH":
      redis.lists.set(key, [...list(), args[0]]);
      return { body: { result: list().length } };
    case "LPOP": {
      const items = list();
      const taken = items.splice(0, Number(args[0] ?? 1));
      redis.lists.set(key, items);
      return { body: { result: taken.length ? taken : null } };
    }
    case "LLEN":
      return { body: { result: list().length } };
    default:
      return { status: 400, body: { error: `unsupported ${op}` } };
  }
});

const ghlCalls = [];
const ghl = await listen((req, body) => {
  ghlCalls.push({ method: req.method, path: req.url, body, headers: req.headers });
  if (req.url === "/contacts/upsert") {
    return { body: { new: true, contact: { id: `contact-${ghlCalls.length}` } } };
  }
  if (req.url.startsWith("/locations/")) {
    return { body: { customFields: [{ id: "field-guests", name: "Guests" }] } };
  }
  if (req.url.startsWith("/opportunities/pipelines")) {
    return {
      body: {
        pipelines: [
          { id: "pipe-events", name: "Events", stages: [{ id: "stage-rsvpd", name: "RSVP'd" }] },
        ],
      },
    };
  }
  return { body: {} };
});

/** Credentials and flags this run controls, so a developer's shell can't leak in. */
const baseEnv = {
  ...process.env,
  MMG_ADMIN_TOKEN: ADMIN_TOKEN,
  KV_REST_API_URL: kv.url,
  KV_REST_API_TOKEN: "smoke",
  GHL_ENABLED: "false",
  GHL_TOKEN: "",
  GHL_LOCATION_ID: "",
  GHL_API_BASE: ghl.url,
};

const post = (path, body, headers = {}) =>
  fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

let checks = 0;
function check(label, ok, detail = "") {
  checks += 1;
  if (ok) console.log(`  ok  ${label}`);
  else failures.push(`${label}${detail ? ` -> ${detail}` : ""}`);
}

/** Every event slug linked from /events, so these checks follow the live calendar. */
async function eventSlugs() {
  const html = await (await fetch(`${BASE}/events`)).text();
  return [...new Set([...html.matchAll(/href="\/events\/([a-z0-9-]+)"/g)].map((m) => m[1]))].filter(
    (slug) => slug !== "past",
  );
}

/** The RSVP button must survive on at least one upcoming event. */
async function checkUpcomingRsvp() {
  for (const slug of await eventSlugs()) {
    const html = await (await fetch(`${BASE}/events/${slug}`)).text();
    if (html.includes("RSVP — takes 30 seconds") && html.includes("Add to calendar")) {
      check(`/events/${slug} (next upcoming) has RSVP + Add to calendar`, true);
      return;
    }
  }
  check("an upcoming event page has RSVP + Add to calendar", false, "none found in the feed");
}

async function checkThreadsApi() {
  const threads = [];
  for (const slug of await eventSlugs()) {
    const res = await fetch(`${BASE}/api/event-threads?slug=${slug}`);
    if (res.ok) threads.push({ slug, ...(await res.json()).thread });
  }
  const open = threads.find((t) => !t.locked);
  const closed = threads.find((t) => t.locked);

  const unknown = await fetch(`${BASE}/api/event-threads?slug=not-a-real-event`);
  check("/api/event-threads unknown event -> 404", unknown.status === 404, unknown.status);

  if (closed) {
    const res = await post("/api/event-threads", {
      action: "post",
      slug: closed.slug,
      identity: "late@example.com",
      name: "Late Guest",
      body: "Hello?",
      rsvp: "going",
    });
    const data = await res.json();
    check("/api/event-threads locks a week after the event", data.reason === "locked", data.reason);
  }

  if (!open) {
    console.log("  --  /api/event-threads: no open event in the feed, posting checks skipped");
    return;
  }
  const slug = open.slug;
  const say = (identity, body, extra = {}) =>
    post("/api/event-threads", {
      action: "post",
      slug,
      identity,
      name: "Jordan Alvarez",
      body,
      rsvp: "going",
      ...extra,
    });

  check("/api/event-threads partner slot ships off", open.pinned === null);

  let res = await say("nobody@example.com", "Hi", { rsvp: null });
  check("/api/event-threads posting needs an RSVP", res.status === 403, res.status);
  res = await say("nope@example.com", "Hi", { rsvp: "no" });
  check("/api/event-threads Can't-make-it can't post", res.status === 403, res.status);

  res = await say("jordan@example.com", "See everyone Thursday");
  let data = await res.json();
  check("/api/event-threads Going can post", res.ok && data.ok, JSON.stringify(data));
  check(
    "/api/event-threads shows first name + last initial",
    data.message?.displayName === "Jordan A.",
    data.message?.displayName,
  );
  const messageId = data.message?.id;

  res = await say("jordan@example.com", "And again");
  check("/api/event-threads one post per 5 seconds", res.status === 429, res.status);

  res = await say("maybe@example.com", "Might swing by", { rsvp: "maybe" });
  check("/api/event-threads Maybe can post", res.ok, res.status);
  res = await say("long@example.com", "x".repeat(501));
  check("/api/event-threads rejects over 500 chars", (await res.json()).reason === "too_long");
  res = await say("rude@example.com", "this is shit");
  check("/api/event-threads rejects profanity", (await res.json()).reason === "profanity");
  res = await say("blank@example.com", "   ");
  check("/api/event-threads rejects empty", (await res.json()).reason === "empty");

  const state = await (await fetch(`${BASE}/api/event-threads?slug=${slug}`)).text();
  check(
    "/api/event-threads never exposes emails or reporters",
    !state.includes("@example.com") && !state.includes("reportedBy") && !state.includes("identity"),
  );

  const report = (reporter) =>
    post("/api/event-threads", { action: "report", slug, id: messageId, reporter });
  await report("a@example.com");
  await report("a@example.com");
  data = await (await report("b@example.com")).json();
  check("/api/event-threads same reporter counts once", data.hidden === false);
  data = await (await report("c@example.com")).json();
  check("/api/event-threads hides after 3 reports", data.hidden === true);
  const visible = (await (await fetch(`${BASE}/api/event-threads?slug=${slug}`)).json()).thread;
  check(
    "/api/event-threads hidden message leaves the public thread",
    !visible.messages.some((m) => m.id === messageId),
  );

  const asAdmin = { "x-admin-token": ADMIN_TOKEN };
  res = await post("/api/event-threads", { action: "unhide", slug, id: messageId });
  check("/api/event-threads admin needs the token", res.status === 401, res.status);
  res = await post(
    "/api/event-threads",
    { action: "unhide", slug, id: messageId },
    { "x-admin-token": "wrong" },
  );
  check("/api/event-threads admin rejects a wrong token", res.status === 401, res.status);
  res = await post("/api/event-threads", { action: "unhide", slug, id: messageId }, asAdmin);
  data = await res.json();
  check(
    "/api/event-threads admin unhide",
    data.ok && data.thread.messages.some((m) => m.id === messageId && !m.hidden),
  );

  res = await post("/api/event-threads", { action: "mute", slug, id: messageId }, asAdmin);
  check("/api/event-threads admin mute", res.ok, res.status);
  await new Promise((r) => setTimeout(r, 5_100)); // clear the 5-second post interval
  data = await (await say("jordan@example.com", "Muted yet?")).json();
  check("/api/event-threads muted guest can't post", data.reason === "muted", data.reason);
  await post("/api/event-threads", { action: "unmute", slug, id: messageId }, asAdmin);
  data = await (await say("jordan@example.com", "Back again")).json();
  check("/api/event-threads unmuted guest can post", data.ok === true, data.reason);

  const partner = (await fetch(`${BASE}/api/event-threads?slug=${slug}`, { headers: asAdmin })
    .then((r) => r.json())
    .then((d) => d.thread.pinnedSlot)) ?? { title: "", body: "", enabled: false };
  check(
    "/api/event-threads partner slot is present in the thread",
    partner.title === "From our partner Coach OS",
    partner.title,
  );
  await post(
    "/api/event-threads",
    { action: "pin", slug, pinned: { ...partner, enabled: true } },
    asAdmin,
  );
  const pinned = (await (await fetch(`${BASE}/api/event-threads?slug=${slug}`)).json()).thread
    .pinned;
  check(
    "/api/event-threads admin can switch the partner slot on",
    pinned?.title === "From our partner Coach OS",
  );
  await post(
    "/api/event-threads",
    { action: "pin", slug, pinned: { ...partner, enabled: false } },
    asAdmin,
  );
}

const rsvpPayload = (email, extra = {}) => ({
  type: "rsvp",
  name: "Jordan Alvarez",
  email,
  phone: "(954) 555-0142",
  company: "Alvarez Injury Law",
  role: "attorney",
  guests: 2,
  status: "going",
  eventSlug: "fall-personal-injury-professionals-mixer",
  eventTitle: "Fall Personal Injury Professionals Mixer",
  eventDate: "2026-09-24",
  ...extra,
});

/** GHL switched off: everything is captured, nothing leaves the server. */
async function checkGhlOff() {
  let data = await (await fetch(`${BASE}/api/ghl`)).json();
  check("/api/ghl reports off + durable store", data.mode === "off" && data.durable === true);

  let res = await post("/api/ghl", rsvpPayload("first@example.com"));
  data = await res.json();
  check("/api/ghl queues an RSVP while off", data.status === "queued", JSON.stringify(data));
  data = await (await post("/api/ghl", rsvpPayload("first@example.com"))).json();
  check("/api/ghl drops a double-tap RSVP", data.status === "duplicate", data.status);
  data = await (
    await post("/api/ghl", rsvpPayload("first@example.com", { status: "maybe" }))
  ).json();
  check("/api/ghl a changed answer is not a duplicate", data.status === "queued", data.status);
  data = await (
    await post("/api/ghl", {
      type: "lead",
      name: "Sam Rivera",
      email: "sam@example.com",
      form: "sponsorship",
      interest: "Featured Sponsor",
      message: "Tell me more",
    })
  ).json();
  check("/api/ghl queues a lead while off", data.status === "queued", data.status);

  res = await post("/api/ghl", { type: "rsvp", email: "x@example.com", status: "going" });
  check("/api/ghl rejects an RSVP without an event", res.status === 400, res.status);
  res = await post("/api/ghl", rsvpPayload("x@example.com", { status: "sure" }));
  check("/api/ghl rejects a bad status", res.status === 400, res.status);
  res = await post("/api/ghl", rsvpPayload("not-an-email"));
  check("/api/ghl rejects a bad email", res.status === 400, res.status);
  res = await post("/api/ghl", { type: "other", email: "x@example.com" });
  check("/api/ghl rejects an unknown type", res.status === 400, res.status);

  res = await post("/api/ghl", { action: "replay" });
  check("/api/ghl replay needs the admin token", res.status === 401, res.status);
  res = await post("/api/ghl", { action: "replay" }, { "x-admin-token": ADMIN_TOKEN });
  check("/api/ghl replay refused while off", res.status === 409, res.status);

  data = await (await fetch(`${BASE}/api/ghl`)).json();
  check("/api/ghl outbox holds all 3 captures", data.queued === 3, data.queued);
  check("/api/ghl sent nothing to GoHighLevel while off", ghlCalls.length === 0, ghlCalls.length);
}

/** Flag flipped on after a restart: the outbox replays into GHL, oldest first. */
async function checkGhlGoLive() {
  let data = await (await fetch(`${BASE}/api/ghl`)).json();
  check("/api/ghl live after restart, outbox survived", data.mode === "live" && data.queued === 3);

  data = await (await post("/api/ghl", rsvpPayload("after@example.com"))).json();
  check("/api/ghl accepts a capture once live", data.status === "queued", data.status);

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    data = await (await fetch(`${BASE}/api/ghl`)).json();
    if (data.queued === 0 && ghlCalls.filter((c) => c.path === "/contacts/upsert").length >= 4) {
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  const upserts = ghlCalls.filter((c) => c.path === "/contacts/upsert");
  check("/api/ghl replayed the outbox + the new capture", upserts.length === 4, upserts.length);
  check(
    "/api/ghl replays oldest first",
    upserts.map((c) => c.body.email).join() ===
      "first@example.com,first@example.com,sam@example.com,after@example.com",
    upserts.map((c) => c.body.email).join(),
  );
  check("/api/ghl outbox empty after replay", data.queued === 0, data.queued);
  check(
    "/api/ghl authenticates with GHL_TOKEN + API version",
    ghlCalls.every((c) => c.headers.authorization === "Bearer smoke-token" && c.headers.version),
  );
  check(
    "/api/ghl upserts into GHL_LOCATION_ID with the app as source",
    upserts.every(
      (c) => c.body.locationId === "smoke-location" && c.body.source === "MMG Connect App",
    ),
  );
  const tags = ghlCalls.filter((c) => c.path.endsWith("/tags")).map((c) => c.body.tags.join(" "));
  check(
    "/api/ghl tags RSVPs with event + status",
    tags.some((t) =>
      t.includes("rsvp:fall-personal-injury-professionals-mixer rsvp-status:going"),
    ) &&
      tags.some((t) => t.includes("rsvp-status:maybe")) &&
      tags.some((t) => t.includes("lead:sponsorship")),
    tags.join(" | "),
  );
  const opportunities = ghlCalls.filter((c) => c.path === "/opportunities/");
  check(
    "/api/ghl opens an Events / RSVP'd opportunity for Going only",
    opportunities.length === 2 &&
      opportunities.every((c) => c.body.pipelineStageId === "stage-rsvpd"),
    opportunities.length,
  );
  check(
    "/api/ghl writes the Guests custom field",
    ghlCalls.some((c) => c.method === "PUT" && c.body.customFields?.[0]?.id === "field-guests"),
  );
}

async function startServer(env) {
  const child = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env,
  });
  child.stdout.on("data", (d) => (serverLog += d));
  child.stderr.on("data", (d) => (serverLog += d));
  await waitForServer(child);
  return child;
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise((r) => child.once("exit", r));
  child.kill("SIGTERM");
  await exited;
  // Wait for the port to actually free up before the next server takes it.
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      await fetch(BASE, { signal: AbortSignal.timeout(500) });
      await new Promise((r) => setTimeout(r, 200));
    } catch {
      return;
    }
  }
}

await assertPortFree();

let serverLog = "";
let server;

let exitCode = 0;
try {
  server = await startServer(baseEnv);
  console.log(`\nSmoke testing ${BASE}\n`);

  for (const route of ROUTES) await checkRoute(route);
  for (const asset of ASSETS) await checkAsset(asset);

  // A 404 must still render the app's own not-found page.
  const missing = await fetch(`${BASE}/events/does-not-exist`);
  if (missing.status !== 404) {
    failures.push(`/events/does-not-exist -> expected 404, got ${missing.status}`);
  } else {
    console.log("  ok  /events/does-not-exist (404)");
  }

  await checkContactApi();

  console.log("");
  await checkUpcomingRsvp();
  await checkThreadsApi();
  await checkGhlOff();

  // Go-live: restart with credentials, as a redeploy would.
  await stopServer(server);
  server = await startServer({
    ...baseEnv,
    GHL_ENABLED: "true",
    GHL_TOKEN: "smoke-token",
    GHL_LOCATION_ID: "smoke-location",
  });
  await checkGhlGoLive();

  if (failures.length) {
    console.error(`\n${failures.length} smoke failure(s):`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    exitCode = 1;
  } else {
    console.log(`\nAll ${ROUTES.length + ASSETS.length + 7 + checks} smoke checks passed.`);
  }
} catch (error) {
  console.error("\nSmoke run errored:", error.message);
  console.error(serverLog.slice(-2000));
  exitCode = 1;
} finally {
  server?.kill("SIGTERM");
  kv.server.close();
  ghl.server.close();
}

process.exit(exitCode);
