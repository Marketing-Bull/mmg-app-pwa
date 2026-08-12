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
    ],
  },
  {
    path: "/events",
    expect: [
      "Come meet the personal injury community.",
      "Follow MMG on Eventbrite",
      "Photo recaps",
    ],
  },
  {
    path: "/events/past",
    expect: ["The flyer starts the invitation.", "Flyer archive", "Video recap"],
  },
  {
    path: "/events/pi-networking-mixer-august-2026",
    expect: [
      "RSVP",
      "Add to calendar",
      "Open in Maps",
      "How the evening runs",
      "Who&#x27;s coming",
      "See the next gathering",
    ],
  },
  {
    path: "/events/pi-bowling-mixer-june-2026",
    expect: [
      "Share this recap",
      "Photo gallery",
      "Watch the recap on Instagram",
      "Sponsor a future event",
    ],
  },
  {
    path: "/sponsor",
    expect: [
      "Select Community Partner",
      "Select Featured Sponsor",
      "Select Presenting Partner",
      "561-888-9450",
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

  if (failures.length) {
    console.error(`\n${failures.length} smoke failure(s):`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    exitCode = 1;
  } else {
    console.log(`\nAll ${ROUTES.length + ASSETS.length + 1} smoke checks passed.`);
  }
} catch (error) {
  console.error("\nSmoke run errored:", error.message);
  console.error(serverLog.slice(-2000));
  exitCode = 1;
} finally {
  server.kill("SIGTERM");
}

process.exit(exitCode);
