// Penyimpanan data: Upstash Redis (produksi) atau memori (uji lokal tanpa Redis).

export interface Store {
  hgetall(key: string): Promise<Record<string, string> | null>;
  hset(key: string, values: Record<string, string>): Promise<unknown>;
  hincrby(key: string, field: string, by: number): Promise<number>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  zadd(key: string, score: number, member: string): Promise<unknown>;
  zrevrange(key: string, start: number, stop: number): Promise<string[]>;
  zrem(key: string, member: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  mget(keys: string[]): Promise<(string | null)[]>;
  set(key: string, value: string, exSeconds?: number): Promise<unknown>;
}

function redisEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function upstashStore(url: string, token: string): Promise<Store> {
  const { Redis } = await import("@upstash/redis");
  const r = new Redis({ url, token, automaticDeserialization: false });
  const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
  return {
    async hgetall(key) {
      const v = (await r.hgetall(key)) as Record<string, unknown> | null;
      if (!v || Object.keys(v).length === 0) return null;
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x)]));
    },
    hset: (key, values) => r.hset(key, values),
    hincrby: (key, field, by) => r.hincrby(key, field, by),
    del: (...keys) => (keys.length ? r.del(...keys) : Promise.resolve(0)),
    exists: (key) => r.exists(key),
    zadd: (key, score, member) => r.zadd(key, { score, member }),
    async zrevrange(key, start, stop) {
      const v = (await r.zrange(key, start, stop, { rev: true })) as unknown[];
      return v.map(String);
    },
    zrem: (key, member) => r.zrem(key, member),
    incr: (key) => r.incr(key),
    expire: (key, seconds) => r.expire(key, seconds),
    async get(key) {
      return str(await r.get(key));
    },
    async mget(keys) {
      if (!keys.length) return [];
      const v = (await r.mget(...keys)) as unknown[];
      return v.map(str);
    },
    set: (key, value, exSeconds) =>
      exSeconds ? r.set(key, value, { ex: exSeconds }) : r.set(key, value),
  };
}

/** Penyimpanan memori — hanya untuk uji lokal. Data hilang saat server dimatikan. */
export function memoryStore(): Store {
  const kv = new Map<string, string>();
  const hashes = new Map<string, Map<string, string>>();
  const zsets = new Map<string, Map<string, number>>();
  const expiry = new Map<string, number>();
  const alive = (key: string) => {
    const t = expiry.get(key);
    if (t !== undefined && t <= Date.now()) {
      kv.delete(key);
      hashes.delete(key);
      zsets.delete(key);
      expiry.delete(key);
    }
  };
  return {
    async hgetall(key) {
      alive(key);
      const h = hashes.get(key);
      return h && h.size ? Object.fromEntries(h) : null;
    },
    async hset(key, values) {
      alive(key);
      const h = hashes.get(key) ?? new Map<string, string>();
      for (const [k, v] of Object.entries(values)) h.set(k, String(v));
      hashes.set(key, h);
      return Object.keys(values).length;
    },
    async hincrby(key, field, by) {
      alive(key);
      const h = hashes.get(key) ?? new Map<string, string>();
      const n = Number(h.get(field) ?? 0) + by;
      h.set(field, String(n));
      hashes.set(key, h);
      return n;
    },
    async del(...keys) {
      let n = 0;
      for (const k of keys) {
        if (kv.delete(k) || hashes.delete(k) || zsets.delete(k)) n++;
        expiry.delete(k);
      }
      return n;
    },
    async exists(key) {
      alive(key);
      return kv.has(key) || hashes.has(key) || zsets.has(key) ? 1 : 0;
    },
    async zadd(key, score, member) {
      const z = zsets.get(key) ?? new Map<string, number>();
      z.set(member, score);
      zsets.set(key, z);
      return 1;
    },
    async zrevrange(key, start, stop) {
      const z = zsets.get(key);
      if (!z) return [];
      const sorted = [...z.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
      return sorted.slice(start, stop === -1 ? undefined : stop + 1);
    },
    async zrem(key, member) {
      return zsets.get(key)?.delete(member) ? 1 : 0;
    },
    async incr(key) {
      alive(key);
      const n = Number(kv.get(key) ?? 0) + 1;
      kv.set(key, String(n));
      return n;
    },
    async expire(key, seconds) {
      expiry.set(key, Date.now() + seconds * 1000);
      return 1;
    },
    async get(key) {
      alive(key);
      return kv.get(key) ?? null;
    },
    async mget(keys) {
      return keys.map((k) => {
        alive(k);
        return kv.get(k) ?? null;
      });
    },
    async set(key, value, exSeconds) {
      kv.set(key, value);
      if (exSeconds) expiry.set(key, Date.now() + exSeconds * 1000);
      else expiry.delete(key);
      return "OK";
    },
  };
}

const g = globalThis as unknown as { __klikajeStore?: Promise<Store> };

export function db(): Promise<Store> {
  if (!g.__klikajeStore) {
    const env = redisEnv();
    if (env) {
      g.__klikajeStore = upstashStore(env.url, env.token);
    } else if (process.env.NODE_ENV === "production" && !process.env.ALLOW_MEMORY_STORE) {
      throw new Error(
        "Database belum disambungkan: isi KV_REST_API_URL dan KV_REST_API_TOKEN (sambungkan Upstash Redis di Vercel)."
      );
    } else {
      console.warn("[KlikAje] Redis belum diatur — memakai penyimpanan memori (data hilang saat restart).");
      g.__klikajeStore = Promise.resolve(memoryStore());
    }
  }
  return g.__klikajeStore;
}
