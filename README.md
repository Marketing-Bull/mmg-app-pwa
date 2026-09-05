# MMG App

A mobile-first PWA for **Miller's Marketing Group** — events, 30-second RSVPs, sponsorship, and community discussion for Florida's personal injury professionals.

Content comes from the marketing site's live feed, forms relay through a single API route to Resend, and interaction state lives in the visitor's own browser. It ships as a working v1 and doubles as a clickable prototype.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

No environment variables are required to run it locally. See `.env.example` and [Forms](#forms) for what production needs.

### Before you open a PR

```bash
npm run verify       # format, lint, types, build, smoke — same as CI
```

| Script              | What it does                                                     |
| ------------------- | ---------------------------------------------------------------- |
| `npm run lint`      | ESLint (flat config, `next/core-web-vitals` + `next/typescript`) |
| `npm run typecheck` | `tsc --noEmit`                                                   |
| `npm run format`    | Prettier, with Tailwind class sorting                            |
| `npm run smoke`     | Builds are not enough — see below                                |

**The smoke test.** `next build` can go green while a button quietly disappears
from the rendered HTML — a server component's child getting deferred to an RSC
chunk that never lands will do exactly that, and it happened during this build.
`scripts/smoke.mjs` boots the production server on a free port and asserts every
route returns 200 and still contains its key copy. It picks its own port and
refuses to run if something is already listening, so it can never pass against
a stale server.

CI (`.github/workflows/ci.yml`) runs the same sequence on every PR.

`npm run social-card` is deliberately outside that sequence — see
[Link previews](#link-previews).

---

## Routes

| Route            | What it is                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `/`              | Home — hero, shortcut grid, next event, upcoming/recaps/series switcher                                |
| `/events`        | Upcoming / Past / Series in one screen, filterable by series                                           |
| `/events/[slug]` | Event detail — facts up top, then About / People / Talk tabs (+ Recap, Agenda where the event has one) |
| `/events/past`   | Archive of past events with photo recaps and video highlights                                          |
| `/sponsor`       | Tiers, the rooms, and questions — three tabs over one set of stats                                     |
| `/discuss`       | Community hub — threads and event conversation, one tab each                                           |
| `/discuss/[id]`  | A single thread with replies                                                                           |
| `/contact`       | Call/text buttons, then Message / Channels / About Andrew tabs                                         |
| `/offline`       | Shown by the service worker when a page isn't cached                                                   |

Bottom tab bar: **Home · Events · Discuss · Sponsor · Contact**.

---

## The app shell

The phone experience is built to feel like an installed app rather than a
website in a browser: short screens, information you can find without scrolling
for it, and the primary action always within thumb reach. From `lg` up it
becomes an ordinary website again — top nav, full footer, wider layouts.

| Piece                       | What it does                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ui/segmented.tsx`          | The in-page tab switcher. Sticks under the AppBar so switching never means scrolling up.                     |
| `ui/list.tsx`               | Grouped inset list rows — the dense, tappable pattern every phone OS uses for detail.                        |
| `ui/disclosure.tsx`         | `<details>` for supporting content that shouldn't cost scroll height (FAQ, run of show).                     |
| `events/event-row.tsx`      | One event per line: when, where, how full. A month of events fits on a screen.                               |
| `events/event-browser.tsx`  | Filter chips over that list — by series, or by the feed's event type — filtering in place with no page load. |
| `EventActions layout="bar"` | The RSVP row pinned above the tab bar on event pages.                                                        |

**Every tab panel ships in the HTML.** `Segmented` force-mounts all of its
panels and hides the inactive ones with CSS, so the switcher only decides which
panel owns the screen — the content is still server-rendered, indexable,
searchable in-page, and visible to the smoke test. Tabs that unmount their
panels would quietly delete content from the page source; these don't.

Measured on a 390 x 844 viewport against the same content, this cut roughly
55–75% of the scroll height from every screen — home from 7.0 screens to 3.1,
event detail from 5.9 to 2.3, discuss from 5.7 to 1.5.

Rows are built on the server from `src/lib/rows.ts`, so the filterable client
list never receives whole events — descriptions, agendas and comment threads
stay out of the browser bundle.

---

## Editing content

All content is plain JSON. No code changes needed to run the calendar.

```
content/
  site.json           Contact details, tagline, value props, disclaimer
  hosts.json          Andrew's bio, portrait, contact links
  series.json         PI Networking Mixers / Lunch & Learn / Signature Experiences
  partners.json       Sponsor + client logos for the partner wall
  sponsorship.json    The three tiers, prices, and benefits
  discussions.json    Standalone community threads
  feed/
    events.seed.json    Offline fallback snapshot of the live events feed
    sponsors.seed.json  Offline fallback snapshot of the live sponsors feed
```

`site.json`, `hosts.json`, `series.json`, `sponsorship.json` and `discussions.json` are edited here. Events and sponsors are not — see below.

### Adding an event

Publish it on millersmarketinggroup.com. Events and sponsors come from that site's live feed (`/api/events`, `/api/sponsors`), which `src/lib/feed.ts` fetches with a 5-minute revalidate — a new event appears here within minutes, with no code change and no redeploy.

`content/feed/*.seed.json` is a committed snapshot of the same real data, used only when the live feed is unreachable, malformed, or empty. Refresh it occasionally so the fallback doesn't drift.

The feed carries a date, venue name, city, summary, flyer and register link. It does not carry agendas, attendee rosters, or per-event sponsor lists, so those are omitted rather than invented. Events with no flyer render a branded artwork plate keyed to their series color, so a newly announced event still looks designed before the artwork exists.

The sample files still in `content/events/` are no longer imported. They predate the feed and are kept only as a reference for the richer per-event detail it doesn't carry.

---

## Forms

RSVPs, sponsorship inquiries, and contact messages POST to `/api/contact`, which relays them to `contact@millersmarketinggroup.com` through [Resend](https://resend.com). Mail is sent from the already-verified `millersmarketinggroup.com` domain, and `Reply-To` is set to whoever submitted the form, so replying in the inbox reaches them directly.

**Delivery never gates the UI.** The confirmation screen appears immediately and the request runs alongside it — hotel wifi in an event lobby must not make an RSVP look like it failed. If the relay fails, the confirmation stands and the copy points at Andrew's phone number instead.

> **Required before go-live:** set `RESEND_API_KEY` in the Vercel project (a sending-scoped key from the Resend dashboard). Without it the route logs an error and returns a failure — submissions are not delivered.

The route rejects oversized payloads, caps field count and length, carries a honeypot, and rate-limits per IP. That last one is per-instance and resets on a cold start, so it is a speed bump rather than a guarantee; put Vercel BotID in front of the route if the form ever draws real abuse.

| Variable             | Default                                       | Purpose                                                  |
| -------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `RESEND_API_KEY`     | —                                             | Required to send.                                        |
| `MMG_MAIL_TO`        | `contact@millersmarketinggroup.com`           | Destination inbox.                                       |
| `MMG_MAIL_FROM`      | `MMG App <noreply@millersmarketinggroup.com>` | Must be on a domain verified in Resend.                  |
| `MMG_FORMS_DISABLED` | —                                             | `true` on a preview that shouldn't reach the real inbox. |

---

## Local state

Everything a visitor does — RSVPs, comments, saved events, sponsorship requests, and their profile — is stored under a single `localStorage` key (`mmg-app-v1`). It is per-device and never shared between visitors, which is exactly what a demo needs and honest about what v1 is.

Practical effects:

- RSVP once and your details prefill every later form — the second RSVP is two taps.
- Your RSVP appears at the top of the attendee list with a **You** badge.
- Comments you post appear inline in the thread, highlighted, and survive a refresh.
- **Contact → Demo controls → Reset my activity** clears it all for the next walkthrough.

Migrating to a real database later means replacing `src/lib/store.tsx` and the `submitForm` call sites; nothing else assumes local-only storage.

---

## PWA

- `public/manifest.webmanifest` — standalone display, brand theme colors, maskable icons, app shortcuts to Events / Discuss / Sponsor.
- `public/sw.js` — network-first for pages (fresh event content, cached fallback, then `/offline`), cache-first for hashed static assets. Registered in production only.
- Icons generated from the MMG monogram: 192/512 standard, 192/512 maskable with a 20% safe zone, and an opaque 180px apple-touch-icon.
- An install prompt appears on Android via `beforeinstallprompt`, and as Share → Add to Home Screen instructions on iOS Safari. Dismissal is remembered.

Verify a change to the worker with **DevTools → Application → Service Workers**. `next.config.ts` sends `Cache-Control: max-age=0` for `/sw.js` so a redeploy can't strand returning visitors on a stale shell.

---

## Link previews

`public/assets/brand/social-card.jpg` is what X/Twitter, iMessage, Slack and
LinkedIn show when a link to the app is shared: an iPhone with a **real
screenshot** of the home screen inside it, next to the brand copy. It is wired
up in `src/app/layout.tsx` as both the Open Graph image and a
`summary_large_image` Twitter card.

The screenshot is captured, not mocked, so the preview can't quietly drift away
from the app it advertises. `scripts/social-card.mjs` boots the production
server, opens `/` at an iPhone 15 Pro viewport, and composes the capture into a
phone frame (status bar, Dynamic Island, titanium rail) drawn in CSS.

```bash
npm run build && npm run social-card
```

The output is committed, so this runs neither on build nor in CI — re-run it
when the home screen changes. It needs a Chromium, which is not a dependency of
the app (that would put a browser download in every `npm ci` for a script that
runs twice a year). Either install one:

```bash
npm i -D playwright && npx playwright install chromium
```

or point the script at a browser the machine already has, with
`CHROME_PATH=/path/to/chrome`.

Smoke asserts the image is served and that `/` still carries both meta tags,
including the absolute URL — so neither a rename nor a wrong host can silently
strip every preview.

**The host matters as much as the image.** `metadataBase` decides the absolute
URL crawlers fetch, and a card whose image 404s renders blank however good the
image is. It resolves in this order:

1. `NEXT_PUBLIC_SITE_URL`, if set
2. `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel sets to the project's
   production domain — so this follows the deployment, and keeps working the
   day a custom domain is pointed at the project
3. `https://mmg-app-pwa.vercel.app`, the current production domain

---

## Brand

Design tokens are inherited verbatim from the MMG marketing site's `:root`, so the app and the site read as one brand.

| Token                                 | Value                 | Use                                    |
| ------------------------------------- | --------------------- | -------------------------------------- |
| `--color-espresso`                    | `#261d19`             | Text, dark panels                      |
| `--color-red`                         | `#a52e2a`             | Primary actions, eyebrows              |
| `--color-red-dark`                    | `#76211f`             | Hover                                  |
| `--color-gold`                        | `#f2c94c`             | Featured sponsor tier, accents on dark |
| `--color-cream` / `--color-paper`     | `#fff7e8` / `#fffdf8` | Page and card surfaces                 |
| `--color-sand` / `--color-sand-light` | `#eadbc4` / `#f4eadd` | Chips, secondary fills                 |
| `--color-teal`                        | `#2e7772`             | Confirmations, provider role           |
| `--color-muted`                       | `#6c5e56`             | Secondary text                         |

Type is **Fraunces** (display) over **DM Sans** (UI) — the same pairing as the site, self-hosted as latin-subset variable fonts (~104KB total). No runtime request to Google, so the shell still renders in brand type when opened offline from the home screen.

Photography, flyers, partner logos, and Andrew's portrait are the real MMG assets, re-encoded to WebP (5.7MB → 1.2MB). The one exception is the social card, which is JPEG — link-preview crawlers are the least forgiving consumers in the stack, and it is photographic anyway.

---

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Radix primitives (dialog, tabs, label, slot) · lucide-react

```
src/
  app/            Routes (server components) + globals.css
  components/
    events/       Cards, list rows, browser, artwork, RSVP dialog, attendee list, gallery
    community/    Comment thread
    sponsor/      Tier list + inquiry dialog
    contact/      Contact form
    shared/       Section, host card, partner wall
    shell/        App bar, tab bar, install prompt, service worker, demo tools
    ui/           Button, segmented control, list rows, disclosure, sheet, field, toast, avatar
  lib/            Content loader, site details, types, formatting, .ics builder, forms, store
```

---

## Deploying

Push to Vercel and it builds with no configuration. Set `RESEND_API_KEY` so forms deliver (see [Forms](#forms)), and `MMG_FORMS_DISABLED=true` on any preview deployment that shouldn't reach the real inbox.

Intended to replace the static landing page at `millersmarketingconnects.com`.

---

## Not in v1

Accounts and logins · sponsor payments · push notifications · a database · an admin dashboard for creating events · native App Store builds. Events are edited as JSON and shipped with a deploy.
