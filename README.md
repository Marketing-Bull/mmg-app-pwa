# MMG App

A mobile-first PWA for **Miller's Marketing Group** — events, 30-second RSVPs, sponsorship, and community discussion for Florida's personal injury professionals.

Zero backend. Every route is prerendered static, content lives in JSON under `content/`, forms post straight to FormSubmit.co, and interaction state lives in the visitor's own browser. It ships as a working v1 and doubles as a clickable prototype.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start
```

No environment variables are required to run it. See `.env.example` for the two optional ones.

---

## Routes

| Route | What it is |
| --- | --- |
| `/` | Home — hero, next event, value props, series, recaps, host, partners |
| `/events` | Upcoming mixers and Lunch & Learns |
| `/events/[slug]` | Event detail — venue, agenda, host, RSVP, attendees, sponsors, comments |
| `/events/past` | Archive of past events with photo recaps and video highlights |
| `/sponsor` | Three sponsorship tiers with interest forms |
| `/discuss` | Community hub — standalone threads plus recent event conversation |
| `/discuss/[id]` | A single thread with replies |
| `/contact` | Contact channels, message form, host bio, demo reset |
| `/offline` | Shown by the service worker when a page isn't cached |

Bottom tab bar: **Home · Events · Discuss · Sponsor · Contact**.

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
  events/
    <slug>.json       One file per event
```

### Adding an event

1. Copy an existing file in `content/events/` and edit it. The filename should match the `slug` field.
2. Add one import line to the list at the top of `src/lib/content.ts` and one entry to the `allEvents` array. (Imports are explicit rather than globbed so TypeScript checks every event's shape at build time.)
3. Upcoming vs. past is derived from `date` — nothing else to flip.

Optional per event: `flyer` and `hero` images, `agenda`, `recap` (headline, body, photos, `videoUrl`, stats), `sponsorIds`, `attendees`, `comments`.

Events with no `flyer`/`hero`/recap photo render a branded artwork plate keyed to their series color, so a newly announced event still looks designed before the flyer exists.

### The demo date

`DEMO_TODAY` in `src/lib/content.ts` is pinned to **11 Aug 2026** so the seeded calendar keeps its intended upcoming/past split whenever a stakeholder opens the link. Change it to `new Date()` once the calendar is being maintained for real.

---

## Forms

RSVPs, sponsorship inquiries, and contact messages POST to FormSubmit.co's AJAX endpoint, which forwards them to `contact@millersmarketinggroup.com`.

**Delivery never gates the UI.** The confirmation screen appears immediately and the request runs alongside it — hotel wifi in an event lobby must not make an RSVP look like it failed. If the relay fails, the confirmation stands and the copy points at Andrew's phone number instead.

> **One-time setup before go-live:** FormSubmit holds the first submission to a new address until the owner clicks an activation link. Andrew needs to submit the form once, then confirm the email FormSubmit sends him. Until he does, submissions return a "confirm your email" response and are not delivered. See `.env.example` for using an alias token instead of the raw address.

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

## Brand

Design tokens are inherited verbatim from the MMG marketing site's `:root`, so the app and the site read as one brand.

| Token | Value | Use |
| --- | --- | --- |
| `--color-espresso` | `#261d19` | Text, dark panels |
| `--color-red` | `#a52e2a` | Primary actions, eyebrows |
| `--color-red-dark` | `#76211f` | Hover |
| `--color-gold` | `#f2c94c` | Featured sponsor tier, accents on dark |
| `--color-cream` / `--color-paper` | `#fff7e8` / `#fffdf8` | Page and card surfaces |
| `--color-sand` / `--color-sand-light` | `#eadbc4` / `#f4eadd` | Chips, secondary fills |
| `--color-teal` | `#2e7772` | Confirmations, provider role |
| `--color-muted` | `#6c5e56` | Secondary text |

Type is **Fraunces** (display) over **DM Sans** (UI) — the same pairing as the site, self-hosted as latin-subset variable fonts (~104KB total). No runtime request to Google, so the shell still renders in brand type when opened offline from the home screen.

Photography, flyers, partner logos, and Andrew's portrait are the real MMG assets, re-encoded to WebP (5.7MB → 1.2MB).

---

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Radix primitives (dialog, tabs, label, slot) · lucide-react

```
src/
  app/            Routes (server components) + globals.css
  components/
    events/       Cards, artwork, RSVP dialog, attendee list, gallery
    community/    Comment thread
    sponsor/      Tier list + inquiry dialog
    contact/      Contact form
    shared/       Section, host card, partner wall
    shell/        App bar, tab bar, install prompt, service worker, demo tools
    ui/           Button, sheet, field, toast, avatar
  lib/            Content loader, types, formatting, .ics builder, forms, store
```

---

## Deploying

Push to Vercel and it builds with no configuration. Optionally set `NEXT_PUBLIC_FORMSUBMIT_ENDPOINT` (and `NEXT_PUBLIC_FORMS_DISABLED=true` on any preview deployment that shouldn't reach the real inbox).

Intended to replace the static landing page at `millersmarketingconnects.com`.

---

## Not in v1

Accounts and logins · sponsor payments · push notifications · a database · an admin dashboard for creating events · native App Store builds. Events are edited as JSON and shipped with a deploy.
