/**
 * The small amount of server-side state this app keeps: per-event discussion
 * threads and the GoHighLevel outbox.
 *
 * Backed by Redis over Upstash's REST API when the Vercel project has a Redis
 * store connected (Vercel → Storage → Upstash for Redis sets `KV_REST_API_URL`
 * and `KV_REST_API_TOKEN`). No client library — every call is a single fetch.
 *
 * Without those variables it falls back to per-instance memory, which is fine
 * for local dev and CI but is NOT durable on Vercel: a cold start or redeploy
 * wipes it, and two instances don't see each other's writes. `durable` says
 * which one you got, and /api/ghl reports it.
 */

const REST_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export interface Store {
  durable: boolean;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  /** Sets only if absent, expiring after `ttlMs`. True when this call set it. */
  claim(key: string, ttlMs: number): Promise<boolean>;
  del(key: string): Promise<void>;
  /** Appends to the tail of a list. */
  push(key: string, value: string): Promise<void>;
  /** Removes and returns up to `count` items from the head of a list. */
  shift(key: string, count: number): Promise<string[]>;
  length(key: string): Promise<number>;
}

function restStore(url: string, token: string): Store {
  async function command<T>(...args: (string | number)[]): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args.map(String)),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await response.json().catch(() => null)) as {
      result?: T;
      error?: string;
    } | null;
    if (!response.ok || !data || data.error) {
      throw new Error(`Redis ${args[0]} failed: ${data?.error ?? response.status}`);
    }
    return data.result as T;
  }

  return {
    durable: true,
    get: (key) => command<string | null>("GET", key),
    set: async (key, value) => {
      await command("SET", key, value);
    },
    claim: async (key, ttlMs) =>
      (await command<string | null>("SET", key, "1", "NX", "PX", ttlMs)) === "OK",
    del: async (key) => {
      await command("DEL", key);
    },
    push: async (key, value) => {
      await command("RPUSH", key, value);
    },
    shift: async (key, count) => (await command<string[] | null>("LPOP", key, count)) ?? [],
    length: (key) => command<number>("LLEN", key),
  };
}

function memoryStore(): Store {
  const values = new Map<string, string>();
  const expiries = new Map<string, number>();
  const lists = new Map<string, string[]>();

  const live = (key: string) => {
    const expires = expiries.get(key);
    if (expires !== undefined && expires <= Date.now()) {
      values.delete(key);
      expiries.delete(key);
    }
    return values.get(key) ?? null;
  };

  return {
    durable: false,
    get: async (key) => live(key),
    set: async (key, value) => {
      values.set(key, value);
      expiries.delete(key);
    },
    claim: async (key, ttlMs) => {
      if (live(key) !== null) return false;
      values.set(key, "1");
      expiries.set(key, Date.now() + ttlMs);
      return true;
    },
    del: async (key) => {
      values.delete(key);
      expiries.delete(key);
      lists.delete(key);
    },
    push: async (key, value) => {
      lists.set(key, [...(lists.get(key) ?? []), value]);
    },
    shift: async (key, count) => (lists.get(key) ?? []).splice(0, count),
    length: async (key) => lists.get(key)?.length ?? 0,
  };
}

export const store: Store =
  REST_URL && REST_TOKEN ? restStore(REST_URL, REST_TOKEN) : memoryStore();
