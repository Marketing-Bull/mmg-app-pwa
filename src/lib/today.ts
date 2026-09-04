/**
 * The demo is pinned to a fixed "today" so the seeded content keeps its
 * intended upcoming/past split no matter when a stakeholder opens the link.
 * Point this at `new Date()` once the calendar is maintained for real.
 *
 * Kept in its own module so date formatting (which client components use) never
 * has to import `content.ts` and drag every event JSON into the browser bundle.
 */
export const DEMO_TODAY = new Date("2026-08-11T09:00:00-04:00");
