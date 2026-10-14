"use client";

import { useState } from "react";

const REASONS = [
  { v: "penipuan", label: "Penipuan / phishing" },
  { v: "judi", label: "Judi online" },
  { v: "virus", label: "Virus / unduhan berbahaya" },
  { v: "dewasa", label: "Konten dewasa" },
  { v: "lainnya", label: "Lainnya" },
];

export default function ReportForm({ initial, host }: { initial: string; host: string }) {
  const [link, setLink] = useState(initial);
  const [reason, setReason] = useState("penipuan");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/public/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ link, reason, note }),
    });
    setBusy(false);
    if (!r.ok) return setErr(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Gagal mengirim laporan.");
    setDone(true);
  }

  if (done) {
    return (
      <section className="card stack" role="status">
        <h2>Makasih, Bang!</h2>
        <p className="muted" style={{ margin: 0 }}>Laporan udah masuk dan bakal dicek secepatnya.</p>
      </section>
    );
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <div className="field">
        <label htmlFor="r-link">Shortlink yang dilaporin</label>
        <input id="r-link" className="input mono" style={{ fontSize: 14 }} placeholder={`${host}/nama-link`} value={link} onChange={(e) => setLink(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="r-reason">Alasan</label>
        <select id="r-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="r-note">Keterangan <span className="muted" style={{ fontWeight: 400 }}>(boleh kosong)</span></label>
        <textarea id="r-note" className="input" style={{ height: 96, padding: 12, resize: "vertical" }} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {err ? <p role="alert" className="alert">{err}</p> : null}
      <button type="submit" className="btn btn-primary btn-big" disabled={busy}>{busy ? "Ngirim…" : "Kirim laporan"}</button>
    </form>
  );
}
