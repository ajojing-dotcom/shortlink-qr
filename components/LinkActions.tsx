"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LinkDTO } from "@/lib/api";
import { copyText, useToast } from "./Toast";

/** Tombol di halaman detail: salin, QR, nonaktif/aktif, hapus. */
export default function LinkActions({ link, origin }: { link: LinkDTO; origin: string }) {
  const router = useRouter();
  const { toast, node } = useToast();
  const [busy, setBusy] = useState(false);
  const full = `${origin}/${link.slug}`;

  async function patch(body: object) {
    setBusy(true);
    const res = await fetch(`/api/admin/links/${link.slug}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) return toast((await res.json().catch(() => ({}))).error ?? "Gagal.");
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Hapus ${full.replace(/^https?:\/\//, "")}? Statistiknya ikut kehapus.`)) return;
    const res = await fetch(`/api/admin/links/${link.slug}`, { method: "DELETE" });
    if (!res.ok) return toast("Gagal menghapus.");
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="row">
      <button type="button" className="btn btn-primary" onClick={async () => { await copyText(full); toast("Link udah disalin!"); }}>Salin link</button>
      <Link className="btn" href={`/admin/qr?d=${encodeURIComponent(full)}`}>Kode QR</Link>
      <button type="button" className="btn" disabled={busy} onClick={() => patch({ active: !link.active })}>{link.active ? "Nonaktifkan" : "Aktifkan"}</button>
      <button type="button" className="btn" style={{ color: "var(--danger)" }} onClick={remove}>Hapus</button>
      {node}
    </div>
  );
}
