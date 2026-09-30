import { createHash, timingSafeEqual } from "node:crypto";

/**
 * One shared moderator token (`MMG_ADMIN_TOKEN`), sent as `x-admin-token`.
 * Unset means every admin action is refused — there is no default.
 */
export function isAdmin(request: Request): boolean {
  const expected = process.env.MMG_ADMIN_TOKEN;
  const given = request.headers.get("x-admin-token");
  if (!expected || !given) return false;
  // Hash both sides so the comparison is constant-time whatever the lengths.
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}
