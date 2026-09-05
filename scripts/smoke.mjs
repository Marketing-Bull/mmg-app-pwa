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
    path: "/events/fall-personal-injury-professionals-mixer",
    expect: ["RSVP", "Add to calendar", "Open in Maps", "Who&#x27;s coming", "JOEY Aventura"],
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

await assertPortFree();

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
});

let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

let exitCode = 0;
try {
  await waitForServer(server);
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

  if (failures.length) {
    console.error(`\n${failures.length} smoke failure(s):`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    exitCode = 1;
  } else {
    console.log(`\nAll ${ROUTES.length + ASSETS.length + 7} smoke checks passed.`);
  }
} catch (error) {
  console.error("\nSmoke run errored:", error.message);
  console.error(serverLog.slice(-2000));
  exitCode = 1;
} finally {
  server.kill("SIGTERM");
}

process.exit(exitCode);
