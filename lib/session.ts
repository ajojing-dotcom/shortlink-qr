// Sesi login: cookie berisi payload + tanda tangan HMAC-SHA256 (Web Crypto, jalan di Edge & Node).

export const SESSION_COOKIE = "klikaje_sesi";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET belum diisi atau kurang dari 32 karakter.");
    }
    return "dev-only-secret-dev-only-secret-0000";
  }
  return s;
}

async function hmac(data: string, key = secret()): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(data)));
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionToken(now = Date.now()): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ sub: "admin", exp: now + SESSION_DAYS * 86400_000 })));
  return `${payload}.${b64url(await hmac(payload))}`;
}

export async function verifySessionToken(token: string | undefined | null, now = Date.now()): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    if (!equalBytes(fromB64url(sig), await hmac(payload))) return false;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { exp?: number };
    return typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

/** Bandingkan kata sandi tanpa bocor lewat waktu proses. */
export async function passwordMatches(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const key = "klikaje-password-compare";
  return equalBytes(await hmac(input, key), await hmac(expected, key));
}
