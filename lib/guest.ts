// Mode tamu: bikin shortlink tanpa login, dengan pengaman anti penyalahgunaan.
import { db } from "./db";
import {
  LinkError, createLink, deleteLink, getLink, isSlugTaken, linkStatus, normalizeSlug, normalizeUrl, slugProblem,
  type Link,
} from "./links";

export function publicModeOn(): boolean {
  return (process.env.PUBLIC_MODE ?? "on").trim().toLowerCase() !== "off";
}

export function guestDays(): number {
  const n = Number(process.env.GUEST_LINK_DAYS);
  return Number.isFinite(n) && n >= 1 && n <= 3650 ? Math.floor(n) : 90;
}

function rateLimits(): { hour: number; day: number } {
  const [h, d] = (process.env.GUEST_RATE_LIMIT ?? "10,30").split(",").map((x) => Number(x.trim()));
  return { hour: h > 0 ? h : 10, day: d > 0 ? d : 30 };
}

const SHORTENERS = [
  "bit.ly", "bitly.com", "s.id", "tinyurl.com", "t.co", "goo.gl", "is.gd", "v.gd", "cutt.ly", "rebrand.ly",
  "shorturl.at", "ow.ly", "buff.ly", "rb.gy", "tiny.cc", "shorte.st", "adf.ly", "bl.ink", "short.io", "t.ly",
  "lnk.bio", "clck.ru", "qr.ae", "u.to", "rotf.lol",
];

function hostMatches(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

/** Cek tambahan untuk URL tamu. Melempar LinkError bila ditolak. */
export async function checkGuestUrl(url: string): Promise<void> {
  const host = new URL(url).hostname.toLowerCase();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":") || host === "localhost") {
    throw new LinkError("Link berupa alamat IP tidak bisa dipendekkan di sini.", "url");
  }
  if (SHORTENERS.some((d) => hostMatches(host, d))) {
    throw new LinkError("Link dari layanan pemendek lain tidak bisa dipendekkan lagi. Pakai link aslinya, ye.", "url");
  }
  const blocked = (process.env.BLOCKED_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (blocked.some((d) => hostMatches(host, d))) {
    throw new LinkError("Domain ini diblokir.", "url");
  }
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (key) {
    try {
      const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "klikaje", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = (await res.json()) as { matches?: unknown[] };
        if (data.matches?.length) throw new LinkError("Link ini terdeteksi berbahaya (penipuan/malware), jadi ditolak.", "url");
      }
    } catch (e) {
      if (e instanceof LinkError) throw e;
      console.error("Safe Browsing gagal dicek", e);
    }
  }
}

/** Batasi jumlah pembuatan per IP. Melempar LinkError bila lewat batas. */
export async function takeGuestQuota(ip: string): Promise<void> {
  const store = await db();
  const { hour, day } = rateLimits();
  const hKey = `rl:create:h:${ip}`;
  const dKey = `rl:create:d:${ip}`;
  const h = await store.incr(hKey);
  if (h === 1) await store.expire(hKey, 3600);
  const d = await store.incr(dKey);
  if (d === 1) await store.expire(dKey, 86400);
  if (h > hour || d > day) {
    throw new LinkError(
      h > hour
        ? `Udah ${hour} link dalam sejam, Bang. Istirahat dulu, coba lagi nanti ye.`
        : `Batas ${day} link per hari udah kepake. Coba lagi besok, ye.`
    );
  }
}

// ---------- kunci kelola ----------

const enc = new TextEncoder();

export async function sha256(s: string): Promise<string> {
  const buf = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)));
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function newManageKey(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface GuestCreateInput {
  url: string;
  slug?: string;
}

export async function createGuestLink(input: GuestCreateInput, ip: string, ownHosts: string[]): Promise<{ link: Link; key: string }> {
  if (!publicModeOn()) throw new LinkError("Pembuatan link tanpa login sedang ditutup.");
  const url = normalizeUrl(input.url, ownHosts);
  const slug = normalizeSlug(input.slug ?? "");
  if (slug) {
    const p = slugProblem(slug);
    if (p) throw new LinkError(p, "slug");
    if (slug.length < 4) throw new LinkError("Nama link tamu minimal 4 karakter.", "slug");
    if (await isSlugTaken(slug)) throw new LinkError("Nama link ini sudah dipakai.", "slug");
  }
  await checkGuestUrl(url);
  await takeGuestQuota(ip);
  const key = newManageKey();
  const link = await createLink(
    {
      url,
      slug: slug || undefined,
      expiresAt: Date.now() + guestDays() * 86400_000,
      owner: "guest",
      manageKeyHash: await sha256(key),
    },
    ownHosts
  );
  return { link, key };
}

export async function getGuestLinkWithKey(slug: string, key: string): Promise<Link | null> {
  const link = await getLink(slug);
  if (!link || link.owner !== "guest" || !link.manageKeyHash || !key) return null;
  return (await sha256(key)) === link.manageKeyHash ? link : null;
}

export async function deleteGuestLinkWithKey(slug: string, key: string): Promise<boolean> {
  const link = await getGuestLinkWithKey(slug, key);
  if (!link) return false;
  await deleteLink(link.slug);
  return true;
}

export function publicView(l: Link) {
  return {
    slug: l.slug,
    targetUrl: l.targetUrl,
    clicks: l.clicks,
    createdAt: l.createdAt,
    expiresAt: l.expiresAt,
    status: linkStatus(l),
  };
}

// ---------- laporan link berbahaya ----------

export interface Report {
  id: string;
  slug: string;
  reason: string;
  note: string;
  at: number;
}

const REPORTS = "reports";

export async function addReport(slugOrUrl: string, reason: string, note: string, ip: string): Promise<void> {
  const store = await db();
  const rk = `rl:report:${ip}`;
  const n = await store.incr(rk);
  if (n === 1) await store.expire(rk, 3600);
  if (n > 10) throw new LinkError("Kebanyakan laporan dari sini. Coba lagi nanti, ye.");
  const slug = normalizeSlug(slugOrUrl.replace(/^https?:\/\/[^/]+\//i, "").split(/[?#]/)[0] ?? "");
  if (!slug || !(await getLink(slug))) throw new LinkError("Link itu kagak ketemu. Cek lagi tulisannya.", "slug");
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await store.hset(`report:${id}`, {
    id, slug, reason: reason.slice(0, 40), note: note.trim().slice(0, 500), at: String(Date.now()),
  });
  await store.zadd(REPORTS, Date.now(), id);
}

export async function listReports(): Promise<Report[]> {
  const store = await db();
  const ids = await store.zrevrange(REPORTS, 0, 99);
  const rows = await Promise.all(ids.map((id) => store.hgetall(`report:${id}`)));
  return rows
    .filter((r): r is Record<string, string> => !!r)
    .map((r) => ({ id: r.id, slug: r.slug, reason: r.reason, note: r.note, at: Number(r.at) || 0 }));
}

export async function dismissReport(id: string): Promise<void> {
  const store = await db();
  await store.zrem(REPORTS, id);
  await store.del(`report:${id}`);
}
