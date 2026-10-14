import { site } from "../config/site";
import { db } from "./db";

export type LinkStatus = "aktif" | "nonaktif" | "kedaluwarsa";

export interface Link {
  slug: string;
  targetUrl: string;
  title: string;
  createdAt: number;
  clicks: number;
  lastClickedAt: number | null;
  active: boolean;
  expiresAt: number | null;
  /** "admin" = dibuat pemilik, "guest" = dibuat tamu tanpa login */
  owner: "admin" | "guest";
  /** hash SHA-256 kunci kelola (khusus link tamu) */
  manageKeyHash: string;
}

export class LinkError extends Error {
  constructor(message: string, public field?: "url" | "slug" | "title" | "expiresAt") {
    super(message);
  }
}

export const RESERVED_SLUGS = new Set([
  "admin", "api", "login", "logout", "qr", "_next", "static", "public", "assets",
  "favicon.ico", "robots.txt", "sitemap.xml", "icon", "apple-icon", "manifest",
  "kelola", "lapor", "brand", "opengraph-image", "twitter-image",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;
const RANDOM_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // tanpa 0/o, 1/l/i yang mirip

const K = {
  link: (s: string) => `link:${s}`,
  list: "links",
  day: (s: string, d: string) => `clicks:${s}:${d}`,
  device: (s: string) => `device:${s}`,
  ref: (s: string) => `ref:${s}`,
};

// ---------- validasi ----------

export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Pesan galat (bahasa Indonesia) atau null kalau slug boleh dipakai. */
export function slugProblem(slug: string): string | null {
  if (slug.length < 2) return "Nama link minimal 2 karakter.";
  if (slug.length > 50) return "Nama link maksimal 50 karakter.";
  if (!SLUG_RE.test(slug)) return "Pakai huruf kecil, angka, dan tanda hubung (-) saja. Tidak boleh diawali/diakhiri tanda hubung.";
  if (RESERVED_SLUGS.has(slug)) return "Nama ini dipakai sistem, pilih yang lain.";
  return null;
}

export function normalizeUrl(raw: string, ownHosts: string[] = []): string {
  let input = raw.trim();
  if (!input) throw new LinkError("URL tujuan wajib diisi.", "url");
  if (!/^[a-z][a-z0-9+.-]*:/i.test(input)) input = `https://${input}`;
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    throw new LinkError("URL tidak valid. Contoh: https://contoh.go.id/halaman", "url");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new LinkError("Hanya URL http:// atau https:// yang boleh.", "url");
  }
  if (!u.hostname.includes(".") && u.hostname !== "localhost") {
    throw new LinkError("URL tidak valid. Contoh: https://contoh.go.id/halaman", "url");
  }
  const host = u.hostname.toLowerCase();
  const own = [site.domain, ...ownHosts].map((h) => h.toLowerCase().split(":")[0]).filter(Boolean);
  if (own.some((h) => host === h || host === `www.${h}`)) {
    throw new LinkError("URL tujuan tidak boleh mengarah ke shortlink sendiri.", "url");
  }
  if (u.toString().length > 4000) throw new LinkError("URL terlalu panjang.", "url");
  return u.toString();
}

function parseExpiry(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  // input tanggal "YYYY-MM-DD" → akhir hari itu waktu Jakarta
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const t = m ? Date.parse(`${m[1]}-${m[2]}-${m[3]}T23:59:59+07:00`) : Date.parse(value);
  if (Number.isNaN(t)) throw new LinkError("Tanggal kedaluwarsa tidak valid.", "expiresAt");
  return t;
}

// ---------- tanggal ----------

export function dayKey(d: Date | number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: site.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

export function lastDays(n: number, now = Date.now()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(now - i * 86400_000));
  return out;
}

// ---------- baca/tulis ----------

function fromHash(h: Record<string, string>): Link {
  return {
    slug: h.slug,
    targetUrl: h.targetUrl,
    title: h.title ?? "",
    createdAt: Number(h.createdAt) || 0,
    clicks: Number(h.clicks) || 0,
    lastClickedAt: h.lastClickedAt ? Number(h.lastClickedAt) : null,
    active: h.active !== "0",
    expiresAt: h.expiresAt ? Number(h.expiresAt) : null,
    owner: h.owner === "guest" ? "guest" : "admin",
    manageKeyHash: h.manageKeyHash ?? "",
  };
}

function toHash(l: Link): Record<string, string> {
  return {
    slug: l.slug,
    targetUrl: l.targetUrl,
    title: l.title,
    createdAt: String(l.createdAt),
    clicks: String(l.clicks),
    lastClickedAt: l.lastClickedAt ? String(l.lastClickedAt) : "",
    active: l.active ? "1" : "0",
    expiresAt: l.expiresAt ? String(l.expiresAt) : "",
    owner: l.owner,
    manageKeyHash: l.manageKeyHash,
  };
}

export function linkStatus(l: Link, now = Date.now()): LinkStatus {
  if (!l.active) return "nonaktif";
  if (l.expiresAt && l.expiresAt < now) return "kedaluwarsa";
  return "aktif";
}

export async function getLink(slug: string): Promise<Link | null> {
  const s = normalizeSlug(slug);
  if (!s || s.length > 50) return null;
  const h = await (await db()).hgetall(K.link(s));
  return h ? fromHash(h) : null;
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  return (await (await db()).exists(K.link(normalizeSlug(slug)))) === 1;
}

export async function listLinks(): Promise<Link[]> {
  const store = await db();
  const slugs = await store.zrevrange(K.list, 0, -1);
  const rows = await Promise.all(slugs.map((s) => store.hgetall(K.link(s))));
  return rows.filter((h): h is Record<string, string> => !!h).map(fromHash);
}

async function randomFreeSlug(): Promise<string> {
  const bytes = new Uint8Array(site.randomSlugLength);
  for (let attempt = 0; attempt < 10; attempt++) {
    crypto.getRandomValues(bytes);
    const s = Array.from(bytes, (b) => RANDOM_ALPHABET[b % RANDOM_ALPHABET.length]).join("");
    if (!RESERVED_SLUGS.has(s) && !(await isSlugTaken(s))) return s;
  }
  throw new LinkError("Gagal membuat nama acak, coba lagi.", "slug");
}

export interface CreateInput {
  url: string;
  slug?: string;
  title?: string;
  expiresAt?: string | number | null;
  owner?: "admin" | "guest";
  manageKeyHash?: string;
}

export async function createLink(input: CreateInput, ownHosts: string[] = []): Promise<Link> {
  const targetUrl = normalizeUrl(input.url, ownHosts);
  let slug = normalizeSlug(input.slug ?? "");
  if (slug) {
    const p = slugProblem(slug);
    if (p) throw new LinkError(p, "slug");
    if (await isSlugTaken(slug)) throw new LinkError("Nama link ini sudah dipakai.", "slug");
  } else {
    slug = await randomFreeSlug();
  }
  const title = (input.title ?? "").trim().slice(0, 120);
  const link: Link = {
    slug, targetUrl, title,
    createdAt: Date.now(), clicks: 0, lastClickedAt: null, active: true,
    expiresAt: parseExpiry(input.expiresAt),
    owner: input.owner ?? "admin",
    manageKeyHash: input.manageKeyHash ?? "",
  };
  const store = await db();
  await store.hset(K.link(slug), toHash(link));
  await store.zadd(K.list, link.createdAt, slug);
  return link;
}

export interface UpdateInput {
  url?: string;
  slug?: string;
  title?: string;
  expiresAt?: string | number | null;
  active?: boolean;
}

export async function updateLink(slug: string, patch: UpdateInput, ownHosts: string[] = []): Promise<Link> {
  const store = await db();
  const current = await getLink(slug);
  if (!current) throw new LinkError("Link tidak ditemukan.");
  const next: Link = { ...current };
  if (patch.url !== undefined) next.targetUrl = normalizeUrl(patch.url, ownHosts);
  if (patch.title !== undefined) next.title = patch.title.trim().slice(0, 120);
  if (patch.expiresAt !== undefined) next.expiresAt = parseExpiry(patch.expiresAt);
  if (patch.active !== undefined) next.active = patch.active;

  const newSlug = patch.slug !== undefined ? normalizeSlug(patch.slug) : current.slug;
  if (newSlug !== current.slug) {
    const p = slugProblem(newSlug);
    if (p) throw new LinkError(p, "slug");
    if (await isSlugTaken(newSlug)) throw new LinkError("Nama link ini sudah dipakai.", "slug");
    next.slug = newSlug;
    await store.hset(K.link(newSlug), toHash(next));
    await store.zadd(K.list, next.createdAt, newSlug);
    await moveStats(current.slug, newSlug);
    await store.zrem(K.list, current.slug);
    await store.del(K.link(current.slug));
  } else {
    await store.hset(K.link(current.slug), toHash(next));
  }
  return next;
}

async function moveStats(from: string, to: string) {
  const store = await db();
  const days = lastDays(60);
  const vals = await store.mget(days.map((d) => K.day(from, d)));
  await Promise.all(
    vals.map((v, i) => (v ? store.set(K.day(to, days[i]), v, site.statsRetentionDays * 86400) : null))
  );
  for (const key of [K.device, K.ref]) {
    const h = await store.hgetall(key(from));
    if (h) await store.hset(key(to), h);
  }
  await store.del(...days.map((d) => K.day(from, d)), K.device(from), K.ref(from));
}

export async function deleteLink(slug: string): Promise<void> {
  const store = await db();
  const s = normalizeSlug(slug);
  await store.zrem(K.list, s);
  await store.del(K.link(s), K.device(s), K.ref(s), ...lastDays(60).map((d) => K.day(s, d)));
}

// ---------- klik ----------

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|slack|discord|preview|headless|lighthouse/i;

export function deviceOf(ua: string): "ponsel" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "ponsel";
  return "desktop";
}

export function sourceOf(referer: string | null, ownHost?: string): string {
  if (!referer) return "langsung";
  let host = "";
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return "langsung";
  }
  if (ownHost && host === ownHost.split(":")[0]) return "langsung";
  if (/whatsapp|wa\.me/.test(host)) return "whatsapp";
  if (/instagram/.test(host)) return "instagram";
  if (/facebook|fb\.com|fb\.me/.test(host)) return "facebook";
  if (/(^|\.)t\.co$|twitter|x\.com/.test(host)) return "x";
  if (/tiktok/.test(host)) return "tiktok";
  if (/google\./.test(host)) return "google";
  return "lainnya";
}

export async function recordClick(slug: string, ua: string, referer: string | null, ownHost?: string) {
  if (BOT_RE.test(ua)) return;
  const store = await db();
  const now = Date.now();
  const dk = K.day(slug, dayKey(now));
  await Promise.all([
    store.hincrby(K.link(slug), "clicks", 1),
    store.hset(K.link(slug), { lastClickedAt: String(now) }),
    store.incr(dk).then(() => store.expire(dk, site.statsRetentionDays * 86400)),
    store.hincrby(K.device(slug), deviceOf(ua), 1),
    store.hincrby(K.ref(slug), sourceOf(referer, ownHost), 1),
  ]);
}

export interface LinkStats {
  days: { date: string; clicks: number }[];
  last7: number;
  peak: number;
  devices: { label: string; n: number }[];
  sources: { label: string; n: number }[];
}

const SOURCE_LABEL: Record<string, string> = {
  langsung: "Langsung / QR", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook",
  x: "X (Twitter)", tiktok: "TikTok", google: "Google", lainnya: "Lainnya",
};
const DEVICE_LABEL: Record<string, string> = { ponsel: "Ponsel", desktop: "Desktop", tablet: "Tablet" };

export async function getStats(slug: string): Promise<LinkStats> {
  const store = await db();
  const days = lastDays(30);
  const [vals, dev, ref] = await Promise.all([
    store.mget(days.map((d) => K.day(slug, d))),
    store.hgetall(K.device(slug)),
    store.hgetall(K.ref(slug)),
  ]);
  const series = days.map((date, i) => ({ date, clicks: Number(vals[i]) || 0 }));
  const toRows = (h: Record<string, string> | null, labels: Record<string, string>) =>
    Object.entries(h ?? {})
      .map(([k, v]) => ({ label: labels[k] ?? k, n: Number(v) || 0 }))
      .filter((r) => r.n > 0)
      .sort((a, b) => b.n - a.n);
  return {
    days: series,
    last7: series.slice(-7).reduce((a, b) => a + b.clicks, 0),
    peak: Math.max(0, ...series.map((d) => d.clicks)),
    devices: toRows(dev, DEVICE_LABEL),
    sources: toRows(ref, SOURCE_LABEL),
  };
}

// ---------- ekspor ----------

export function toCsv(links: Link[], origin: string): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const fmt = (t: number | null) => (t ? new Date(t).toISOString() : "");
  const head = ["judul", "shortlink", "url_tujuan", "klik", "status", "pembuat", "dibuat", "terakhir_diklik", "kedaluwarsa"];
  const rows = links.map((l) =>
    [l.title, `${origin}/${l.slug}`, l.targetUrl, String(l.clicks), linkStatus(l), l.owner === "guest" ? "tamu" : "pemilik", fmt(l.createdAt), fmt(l.lastClickedAt), fmt(l.expiresAt)]
      .map(esc)
      .join(",")
  );
  return "﻿" + [head.join(","), ...rows].join("\r\n");
}
