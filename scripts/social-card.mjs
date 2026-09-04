/**
 * Social card generator.
 *
 * Renders `public/assets/brand/social-card.jpg` — the 1200x630 image X/Twitter,
 * iMessage, Slack and LinkedIn show when the app is shared: an iPhone with a
 * live screenshot of the app's home screen inside it.
 *
 * The screenshot is real. This boots the production server, opens `/` at an
 * iPhone viewport, then composes that capture into a phone frame rather than
 * mocking up a picture of a UI that would drift from the actual one.
 *
 * The output is committed, so nothing here runs during a normal build or in CI.
 * Re-run it when the home screen changes:
 *
 *   npm run build && npm run social-card
 *
 * It needs a Chromium. Either `npm i -D playwright && npx playwright install
 * chromium`, or point it at a browser you already have:
 *
 *   CHROME_PATH=/path/to/chrome npm run social-card
 */

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/assets/brand/social-card.jpg");

/** The card is a fixed-size canvas; every number below is in these pixels. */
const CARD = { width: 1200, height: 630 };
/** iPhone 15 Pro. The screenshot's aspect ratio has to match the frame's screen. */
const PHONE = { width: 393, height: 852 };

async function freePort() {
  return new Promise((res, rej) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", rej);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => res(port));
    });
  });
}

async function waitForServer(base, child, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`next start exited with code ${child.exitCode}`);
    try {
      if ((await fetch(base, { signal: AbortSignal.timeout(2000) })).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start on ${base} within ${timeoutMs}ms`);
}

/**
 * Playwright is deliberately not a dependency of this app — it would pull a
 * browser download into every `npm ci`, including CI, for a script that runs a
 * couple of times a year. Find whichever copy the machine already has.
 */
async function loadChromium() {
  const specifiers = [process.env.PLAYWRIGHT_MODULE, "playwright", "playwright-core"].filter(
    Boolean,
  );
  for (const specifier of specifiers) {
    try {
      return (await import(specifier)).chromium;
    } catch {
      // Try the next one.
    }
  }
  throw new Error(
    "No Playwright found. Install it (npm i -D playwright && npx playwright install chromium) " +
      "or set PLAYWRIGHT_MODULE to an existing copy.",
  );
}

async function launch(chromium) {
  const attempts = [];
  if (process.env.CHROME_PATH) attempts.push({ executablePath: process.env.CHROME_PATH });
  attempts.push({}, { channel: "chrome" });
  let lastError;
  for (const options of attempts) {
    try {
      return await chromium.launch(options);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(
    `Could not launch Chromium (${lastError?.message}). Run \`npx playwright install chromium\` ` +
      "or set CHROME_PATH to a Chrome/Chromium binary.",
  );
}

const dataUrl = async (path, mime) =>
  `data:${mime};base64,${(await readFile(path)).toString("base64")}`;

/**
 * The card markup. Self-contained: fonts, logo and the screenshot are all
 * inlined, so the page renders identically with no network and no file access.
 */
function cardHtml({ dmSans, fraunces, logo, shot }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face { font-family: "DM Sans"; src: url(${dmSans}) format("woff2"); font-weight: 400 700; }
      @font-face { font-family: "Fraunces"; src: url(${fraunces}) format("woff2"); font-weight: 400 700; }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        width: ${CARD.width}px;
        height: ${CARD.height}px;
        overflow: hidden;
        font-family: "DM Sans", sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      /* Espresso, the brand's darkest token, so the cream app screen pops. */
      .card {
        position: relative;
        width: 100%;
        height: 100%;
        background:
          radial-gradient(1100px 620px at 78% 4%, rgba(242, 201, 76, 0.16), transparent 62%),
          radial-gradient(760px 560px at 6% 100%, rgba(165, 46, 42, 0.28), transparent 66%),
          linear-gradient(148deg, #33251e 0%, #261d19 46%, #191211 100%);
        overflow: hidden;
      }

      .copy { position: absolute; top: 126px; left: 76px; width: 660px; }

      .brand { display: flex; align-items: center; gap: 14px; }
      .brand .mark {
        display: grid; place-items: center; width: 50px; height: 50px; border-radius: 15px;
        background: rgba(255, 247, 232, 0.07);
        box-shadow: inset 0 0 0 1px rgba(242, 201, 76, 0.28);
      }
      .brand .mark img { width: 34px; height: 34px; object-fit: contain; }
      .brand .wordmark {
        font-size: 15px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;
        color: rgba(255, 247, 232, 0.72);
      }

      h1 {
        margin-top: 34px;
        font-family: "Fraunces", Georgia, serif;
        font-weight: 600; font-size: 60px; line-height: 1.04; letter-spacing: -0.035em;
        color: #fff7e8;
      }
      h1 em { display: block; font-style: normal; color: #f2c94c; }

      p {
        margin-top: 26px; max-width: 570px;
        font-size: 22px; line-height: 1.45; color: rgba(255, 247, 232, 0.68);
      }

      .pills { display: flex; gap: 10px; margin-top: 34px; }
      .pills span {
        padding: 9px 18px 10px; border-radius: 999px;
        font-size: 16px; font-weight: 500; color: rgba(255, 247, 232, 0.82);
        background: rgba(255, 247, 232, 0.06);
        box-shadow: inset 0 0 0 1px rgba(255, 247, 232, 0.14);
      }

      /* --- The phone ------------------------------------------------------ */
      /* Screen is 330px wide; its height keeps the ${PHONE.width}x${PHONE.height}
         capture at native aspect so nothing inside is stretched. */
      .phone {
        --screen-w: 330px;
        --screen-h: ${(330 * PHONE.height) / PHONE.width}px;
        --bezel: 13px;
        position: absolute; top: 62px; left: 768px;
        width: calc(var(--screen-w) + var(--bezel) * 2);
        height: calc(var(--screen-h) + var(--bezel) * 2);
        border-radius: 60px;
        padding: var(--bezel);
        /* Brushed-titanium rail: light on the edges, dark across the faces. */
        background: linear-gradient(118deg, #8a8079 0%, #3b322e 16%, #6e645d 34%, #2a2320 62%, #7b716a 84%, #2f2724 100%);
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.22),
          0 2px 2px rgba(255, 255, 255, 0.06),
          0 44px 90px rgba(0, 0, 0, 0.55),
          0 12px 28px rgba(0, 0, 0, 0.4);
      }

      .screen {
        position: relative; width: 100%; height: 100%;
        border-radius: 47px; overflow: hidden; background: #fff7e8;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.55);
      }
      /* iOS reserves this strip and the web capture doesn't, so the frame draws
         it. Without it the Dynamic Island sits on top of the app bar. */
      .status {
        display: flex; align-items: center; justify-content: space-between;
        height: 44px; padding: 2px 26px 0; background: #fff7e8; color: #261d19;
      }
      .status .time { font-size: 15px; font-weight: 700; letter-spacing: 0.01em; }
      .status .indicators { display: flex; align-items: flex-end; gap: 6px; }
      .status svg { display: block; }

      .screen img {
        display: block; width: 100%; height: calc(100% - 44px);
        object-fit: cover; object-position: top center;
      }

      /* Glass: one soft diagonal sweep, kept faint so the UI stays readable. */
      .glare {
        position: absolute; inset: 0; pointer-events: none;
        background: linear-gradient(122deg, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0.07) 20%, rgba(255, 255, 255, 0) 44%);
      }

      .island {
        position: absolute; top: calc(var(--bezel) + 11px); left: 50%; transform: translateX(-50%);
        width: 106px; height: 31px; border-radius: 999px; background: #000;
      }

      .btn { position: absolute; width: 3px; background: linear-gradient(180deg, #6f655e, #2c2522); }
      .silent { left: -3px; top: 118px; height: 30px; border-radius: 3px 0 0 3px; }
      .vol-up { left: -3px; top: 168px; height: 58px; border-radius: 3px 0 0 3px; }
      .vol-dn { left: -3px; top: 240px; height: 58px; border-radius: 3px 0 0 3px; }
      .power { right: -3px; top: 208px; height: 92px; border-radius: 0 3px 3px 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="copy">
        <div class="brand">
          <span class="mark"><img src="${logo}" alt="" /></span>
          <span class="wordmark">Miller&rsquo;s Marketing Group</span>
        </div>
        <h1>Florida&rsquo;s PI community,<em>in one app.</em></h1>
        <p>Curated events, 30-second RSVPs, sponsorship and discussion &mdash; installable straight to the home screen.</p>
        <div class="pills"><span>Events</span><span>RSVP</span><span>Discuss</span><span>Sponsor</span></div>
      </div>

      <div class="phone">
        <div class="screen">
          <div class="status">
            <span class="time">9:41</span>
            <span class="indicators">
              <svg width="19" height="12" viewBox="0 0 19 12" fill="#261d19" aria-hidden="true">
                <rect x="0" y="8" width="3" height="4" rx="1" />
                <rect x="5.3" y="5.5" width="3" height="6.5" rx="1" />
                <rect x="10.6" y="3" width="3" height="9" rx="1" />
                <rect x="15.9" y="0" width="3" height="12" rx="1" />
              </svg>
              <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="#261d19" stroke-width="1.9" stroke-linecap="round" aria-hidden="true">
                <path d="M1.2 4.1a11 11 0 0 1 14.6 0" />
                <path d="M4.1 7.2a6.7 6.7 0 0 1 8.8 0" />
                <path d="M7 10.2a2.4 2.4 0 0 1 3 0" />
              </svg>
              <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden="true">
                <rect x="0.6" y="0.6" width="22" height="11.8" rx="3.4" fill="none" stroke="#261d19" stroke-opacity="0.4" stroke-width="1.1" />
                <rect x="2.2" y="2.2" width="18.8" height="8.6" rx="2.2" fill="#261d19" />
                <path d="M24.2 4.4v4.2a2.3 2.3 0 0 0 0-4.2Z" fill="#261d19" fill-opacity="0.4" />
              </svg>
            </span>
          </div>
          <img src="${shot}" alt="" />
          <div class="glare"></div>
        </div>
        <div class="island"></div>
        <span class="btn silent"></span>
        <span class="btn vol-up"></span>
        <span class="btn vol-dn"></span>
        <span class="btn power"></span>
      </div>
    </div>
  </body>
</html>`;
}

if (!existsSync(resolve(ROOT, ".next/BUILD_ID"))) {
  console.error("No production build found. Run `npm run build` first.");
  process.exit(1);
}

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const chromium = await loadChromium();

const server = spawn("npx", ["next", "start", "-p", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

let browser;
let exitCode = 0;
try {
  await waitForServer(base, server);
  browser = await launch(chromium);

  // 1. Capture the home screen exactly as a phone gets it.
  const phone = await browser.newContext({
    viewport: PHONE,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  // The install banner is a visitor nudge, not part of the app's home screen.
  await phone.addInitScript(() => {
    try {
      localStorage.setItem("mmg-install-dismissed", "1");
    } catch {
      /* storage blocked */
    }
  });
  const app = await phone.newPage();
  await app.goto(base, { waitUntil: "networkidle" });
  await app.evaluate(() => document.fonts.ready);
  // Let the feed images finish decoding; a half-painted flyer would be baked in.
  await app.waitForTimeout(1500);
  const shot = await app.screenshot();
  await phone.close();
  console.log(`  captured  ${PHONE.width}x${PHONE.height} @3x home screen`);

  // 2. Compose it into the card.
  const html = cardHtml({
    dmSans: await dataUrl(resolve(ROOT, "src/fonts/dm-sans-latin-var.woff2"), "font/woff2"),
    fraunces: await dataUrl(resolve(ROOT, "src/fonts/fraunces-latin-var.woff2"), "font/woff2"),
    logo: await dataUrl(resolve(ROOT, "public/assets/brand/mmg-official-logo.webp"), "image/webp"),
    shot: `data:image/png;base64,${shot.toString("base64")}`,
  });

  const canvas = await browser.newContext({ viewport: CARD, deviceScaleFactor: 2 });
  const card = await canvas.newPage();
  await card.setContent(html, { waitUntil: "load" });
  await card.evaluate(() => document.fonts.ready);
  // JPEG, not PNG: the card is photographic and a 1.8MB PNG makes every
  // unfurl slower for no visible gain.
  const image = await card.screenshot({ type: "jpeg", quality: 92 });
  await canvas.close();

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, image);
  console.log(
    `  wrote     ${OUT} (${CARD.width}x${CARD.height} @2x, ${Math.round(image.length / 1024)}KB)`,
  );
} catch (error) {
  console.error("\nCard generation failed:", error.message);
  if (serverLog) console.error(serverLog.slice(-2000));
  exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}

process.exit(exitCode);
