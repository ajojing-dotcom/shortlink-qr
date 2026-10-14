"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_STYLE, downloadBlob, exportPng, safeName } from "@/lib/qr";
import QrView from "./QrView";
import { copyText, useToast } from "./Toast";

type View = { slug: string; targetUrl: string; clicks: number; createdAt: number; expiresAt: number | null; status: "aktif" | "nonaktif" | "kedaluwarsa" };
const STATUS = { aktif: "Aktif", nonaktif: "Nonaktif", kedaluwarsa: "Kedaluwarsa" } as const;
const fmt = (t: number) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(t);

export default function ManageGuest({ link, kunci, origin }: { link: View; kunci: string; origin: string }) {
  const router = useRouter();
  const { toast, node } = useToast();
  const [busy, setBusy] = useState(false);
  const host = origin.replace(/^https?:\/\//, "");
  const full = `${origin}/${link.slug}`;

  async function remove() {
    if (!window.confirm(`Hapus ${host}/${link.slug}? Link & QR-nya bakal kagak bisa dibuka lagi.`)) return;
    setBusy(true);
    const r = await fetch(`/api/public/links/${link.slug}?kunci=${encodeURIComponent(kunci)}`, { method: "DELETE" });
    setBusy(false);
    if (!r.ok) return toast("Gagal menghapus.");
    try {
      const xs = JSON.parse(localStorage.getItem("klikaje.link-saya") ?? "[]") as { slug: string }[];
      localStorage.setItem("klikaje.link-saya", JSON.stringify(xs.filter((x) => x.slug !== link.slug)));
    } catch {
      /* abaikan */
    }
    router.push("/");
  }

  return (
    <section className="card stack" aria-labelledby="kelola">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 id="kelola" style={{ fontSize: 28 }}>Kelola link</h1>
        <span className={`badge ${link.status}`}>{STATUS[link.status]}</span>
      </div>
      <p className="mono" style={{ margin: 0, fontSize: 20, color: "var(--merah-tua)", wordBreak: "break-all" }}>{host}/{link.slug}</p>
      <p className="muted" style={{ margin: 0, wordBreak: "break-all" }}>→ {link.targetUrl}</p>
      <div className="tiles">
        <div className="tile"><div className="tile-label">Jumlah klik</div><div className="tile-num">{link.clicks.toLocaleString("id-ID")}</div></div>
        <div className="tile"><div className="tile-label">Aktif sampai</div><div className="tile-text">{link.expiresAt ? fmt(link.expiresAt) : "Tanpa batas"}</div></div>
      </div>
      <div className="row" style={{ gap: 16, alignItems: "center" }}>
        <div className="qr-frame" style={{ border: "1px solid var(--line)" }}><QrView data={full} size={140} /></div>
        <div className="stack" style={{ gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={async () => { await copyText(full); toast("Link udah disalin!"); }}>Salin link</button>
          <button type="button" className="btn" onClick={async () => downloadBlob(await exportPng(full, DEFAULT_STYLE, 1024), `qr-${safeName(host + "-" + link.slug)}.png`)}>Unduh QR</button>
          <button type="button" className="btn" style={{ color: "var(--danger)" }} disabled={busy} onClick={remove}>Hapus link</button>
        </div>
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Siapa aje yang pegang link kelola ini bisa liat & hapus link-nya. Jangan disebar, ye.</p>
      {node}
    </section>
  );
}
