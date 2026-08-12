/**
 * Storage keys for locally-saved comments. Kept out of store.tsx (which is a
 * client module) so server components can build a key without pulling the
 * whole client store across the boundary.
 */

export function eventCommentKey(slug: string): string {
  return `event:${slug}`;
}

export function threadCommentKey(id: string): string {
  return `thread:${id}`;
}
