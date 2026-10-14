"use client";

import { GigiBalang } from "@/components/Brand";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="solo">
      <div className="solo-gigi"><GigiBalang id="gb-err" /></div>
      <section className="solo-card" role="alert">
        <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>Aduh, ada yang macet nih</h1>
        <p className="muted" style={{ margin: 0 }}>
          Coba lagi sebentar. Kalau baru dipasang, pastikan di Vercel sudah: <b>Storage → Upstash for Redis</b> tersambung,
          <b> ADMIN_PASSWORD</b> &amp; <b>SESSION_SECRET</b> diisi, lalu <b>Redeploy</b>.
        </p>
        {error.digest ? <p className="muted mono" style={{ margin: 0, fontSize: 13 }}>Kode: {error.digest}</p> : null}
        <button type="button" className="btn btn-primary" onClick={reset}>Coba lagi</button>
      </section>
    </main>
  );
}
