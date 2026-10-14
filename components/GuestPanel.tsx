"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_STYLE, downloadBlob, exportPng, exportSvg, safeName } from "@/lib/qr";
import { GigiBalang } from "./Brand";
import { IconCheck, IconCopy, IconQr, IconTrash } from "./Icons";
import QrView from "./QrView";
import { copyText, useToast } from "./Toast";

interface Saved {
  slug: string;
  key: string; // kunci kelola ("" untuk link pemilik)
  targetUrl: string;
  createdAt: number;
  expiresAt: number | null;
  clicks?: number;
  gone?: boolean;
}

const LS = "klikaje.link-saya";
function load(): Saved[] {
  try {
    return JSON.parse(localStorage.getItem(LS) ?? "[]") as Saved[];
  } catch {
    return [];
  }
}
function save(xs: Saved[]) {
  try {
    localStorage.setItem(LS, JSON.stringify(xs.slice(0, 50)));
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
}

const daysLeft = (t: number | null) => (t ? Math.max(0, Math.ceil((t - Date.now()) / 86400_000)) : null);

export default function GuestPanel({ origin, days, loggedIn }: { origin: string; days: number; loggedIn: boolean }) {
  const host = origin.replace(/^https?:\/\//, "");
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [check, setCheck] = useState<{ ok: boolean; msg: string } | null>(null);
  const [last, setLast] = useState<Saved | null>(null);
  const [mine, setMine] = useState<Saved[]>([]);
  const [qrFor, setQrFor] = useState<string | null>(null);
  const { toast, node } = useToast();

  // muat daftar dari browser + ambil jumlah klik terbaru
  const refresh = useCallback(async (xs: Saved[]) => {
    const upd = await Promise.all(
      xs.map(async (x) => {
        if (!x.key) return x;
        try {
          const r = await fetch(`/api/public/links/${x.slug}?kunci=${encodeURIComponent(x.key)}`);
          if (r.status === 404) return { ...x, gone: true };
          const { link } = (await r.json()) as { link: { clicks: number; expiresAt: number | null } };
          return { ...x, clicks: link.clicks, expiresAt: link.expiresAt, gone: false };
        } catch {
          return x;
        }
      })
    );
    setMine(upd);
  }, []);
  useEffect(() => {
    const xs = load();
    setMine(xs);
    refresh(xs);
  }, [refresh]);

  useEffect(() => {
    const s = slug.trim();
    if (!s) return setCheck(null);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/${loggedIn ? "admin" : "public"}/slug?s=${encodeURIComponent(s)}`);
        const b = (await r.json()) as { available: boolean; message: string };
        setCheck({ ok: b.available, msg: b.message });
      } catch {
        setCheck(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [slug, loggedIn]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(loggedIn ? "/api/admin/links" : "/api/public/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, slug: slug.trim() || undefined }),
      });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(b.error ?? "Gagal bikin link.");
      const l = b.link as { slug: string; targetUrl: string; createdAt: number; expiresAt: number | null };
      const item: Saved = { slug: l.slug, key: b.key ?? "", targetUrl: l.targetUrl, createdAt: l.createdAt, expiresAt: l.expiresAt, clicks: 0 };
      setLast(item);
      const xs = [item, ...load().filter((x) => x.slug !== item.slug)];
      save(xs);
      setMine(xs);
      setUrl("");
      setSlug("");
      setCheck(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const full = (s: string) => `${origin}/${s}`;
  const manageUrl = (x: Saved) => `${origin}/kelola/${x.slug}?kunci=${encodeURIComponent(x.key)}`;
  const copy = async (t: string, msg = "Link udah disalin!") => {
    await copyText(t);
    toast(msg);
  };
  const share = async (s: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ url: full(s) });
        return;
      } catch {
        /* dibatalkan */
      }
    }
    copy(full(s));
  };
  const dl = async (s: string, ext: "png" | "svg") => {
    const name = `qr-${safeName(host + "-" + s)}.${ext}`;
    if (ext === "png") downloadBlob(await exportPng(full(s), DEFAULT_STYLE, 1024), name);
    else downloadBlob(new Blob([await exportSvg(full(s), DEFAULT_STYLE, 1024)], { type: "image/svg+xml" }), name);
  };
  const remove = async (x: Saved) => {
    if (!window.confirm(`Hapus ${host}/${x.slug}? Link ini bakal kagak bisa dibuka lagi.`)) return;
    if (x.key && !x.gone) {
      const r = await fetch(`/api/public/links/${x.slug}?kunci=${encodeURIComponent(x.key)}`, { method: "DELETE" });
      if (!r.ok && r.status !== 404) return toast("Gagal menghapus.");
    }
    const xs = load().filter((y) => y.slug !== x.slug);
    save(xs);
    setMine((m) => m.filter((y) => y.slug !== x.slug));
    if (last?.slug === x.slug) setLast(null);
    toast(x.key ? "Link udah dihapus." : "Dihapus dari daftar ini. Kelola link pemilik di dashboard.");
  };

  return (
    <>
      <form onSubmit={submit} className="card stack pub-form" aria-label="Bikin shortlink" noValidate>
        <div className="pub-form-row">
          <label htmlFor="g-url" className="sr-only">Link panjang</label>
          <input id="g-url" type="url" inputMode="url" className="input pub-url" placeholder="Tempel link panjang di mari…" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <button type="submit" className="btn btn-primary pub-go" disabled={busy}>{busy ? "Lagi dibikin…" : "Pendekin, nyok!"}</button>
        </div>
        <div className="row" style={{ gap: "8px 16px" }}>
          <div className="prefixed" style={{ height: 40 }}>
            <span style={{ fontSize: 13 }}>{host}/</span>
            <label htmlFor="g-slug" className="sr-only">Nama link (opsional)</label>
            <input id="g-slug" placeholder="nama-link (boleh kosong)" autoCapitalize="none" spellCheck={false} value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} style={{ width: 200, fontSize: 13 }} />
          </div>
          {check ? (check.ok ? <span className="hint-ok"><IconCheck />{check.msg}</span> : <span className="hint-bad">{check.msg}</span>) : null}
          <span className="muted" style={{ fontSize: 14 }}>
            {loggedIn ? <>Abang lagi login, jadi link dari sini jadi link permanen. Kelola di <Link href="/admin">dashboard</Link>.</>
              : <>Link tamu aktif {days} hari. <Link href="/login">Masuk</Link> buat link permanen, edit &amp; statistik lengkap.</>}
          </span>
        </div>
        {err ? <p role="alert" className="alert">{err}</p> : null}
      </form>

      {last ? (
        <section aria-labelledby="g-hasil" className="hero">
          <div className="hero-gigi"><GigiBalang id="gb-g-hasil" color="#f2b705" /></div>
          <div className="hero-body">
            <h2 id="g-hasil">Shortlink Abang udah jadi</h2>
            <p className="hero-url"><span>{host}/</span><mark>{last.slug}</mark></p>
            <p className="hero-target" title={last.targetUrl}>→ {last.targetUrl.replace(/^https?:\/\//, "")}</p>
            <div className="row">
              <button type="button" className="btn btn-white" onClick={() => copy(full(last.slug))}><IconCopy />Salin</button>
              <Link className="btn btn-on-dark" href={`/qr?d=${encodeURIComponent(full(last.slug))}`}>Atur QR</Link>
              <button type="button" className="btn btn-on-dark" onClick={() => share(last.slug)}>Bagikan</button>
            </div>
            {last.key ? (
              <div className="manage-box">
                <b>Link kelola (simpen baik-baik)</b>
                <span className="mono" style={{ wordBreak: "break-all" }}>{manageUrl(last)}</span>
                <span className="manage-note">Buat liat jumlah klik atau hapus link ini dari HP lain. Cuma ditampilin sekali.</span>
                <button type="button" className="btn btn-sm btn-on-dark" style={{ alignSelf: "flex-start" }} onClick={() => copy(manageUrl(last), "Link kelola udah disalin!")}>Salin link kelola</button>
              </div>
            ) : null}
          </div>
          <div className="qr-box">
            <div className="qr-frame"><QrView data={full(last.slug)} size={160} /></div>
            <div className="row" style={{ justifyContent: "center", gap: 6 }}>
              <button type="button" className="btn btn-sm btn-on-dark" onClick={() => dl(last.slug, "png")}>PNG</button>
              <button type="button" className="btn btn-sm btn-on-dark" onClick={() => dl(last.slug, "svg")}>SVG</button>
            </div>
          </div>
        </section>
      ) : null}

      {mine.length ? (
        <section aria-labelledby="g-riwayat" className="card list">
          <div className="list-head">
            <h2 id="g-riwayat">Link Abang di perangkat ini</h2>
            <span className="muted" style={{ fontSize: 13 }}>Kesimpen di browser ini aje · <Link href="/login">masuk</Link> biar kesimpen di akun</span>
          </div>
          {mine.map((x) => {
            const left = daysLeft(x.expiresAt);
            return (
              <div key={x.slug} className="lcard" style={{ display: "flex" }}>
                <div className="lcard-body">
                  <div className="l-slug" style={{ fontSize: 14, textDecoration: x.gone ? "line-through" : undefined }}>{host}/{x.slug}</div>
                  <div className="muted l-target" style={{ fontSize: 13, maxWidth: "100%" }}>{x.targetUrl.replace(/^https?:\/\//, "")}</div>
                </div>
                <span className="muted" style={{ fontSize: 14, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {x.gone ? "Udah kagak aktif" : `${x.clicks ?? 0} klik${left !== null ? ` · sisa ${left} hari` : ""}`}
                </span>
                <button type="button" className="icon-btn" aria-label={`Salin ${x.slug}`} onClick={() => copy(full(x.slug))}><IconCopy /></button>
                <button type="button" className="icon-btn" aria-label={`QR ${x.slug}`} onClick={() => setQrFor(qrFor === x.slug ? null : x.slug)}><IconQr /></button>
                <button type="button" className="icon-btn danger" aria-label={`Hapus ${x.slug}`} onClick={() => remove(x)}><IconTrash /></button>
                {qrFor === x.slug ? (
                  <div style={{ flexBasis: "100%", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", paddingTop: 8 }}>
                    <div className="qr-frame" style={{ border: "1px solid var(--line)" }}><QrView data={full(x.slug)} size={120} /></div>
                    <button type="button" className="btn btn-sm" onClick={() => dl(x.slug, "png")}>Unduh PNG</button>
                    {x.key ? <button type="button" className="btn btn-sm" onClick={() => copy(manageUrl(x), "Link kelola udah disalin!")}>Salin link kelola</button> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}
      {node}
    </>
  );
}
