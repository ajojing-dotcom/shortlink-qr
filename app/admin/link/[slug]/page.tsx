import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LinkActions from "@/components/LinkActions";
import { IconBack } from "@/components/Icons";
import { dto } from "@/lib/api";
import { getLink, getStats } from "@/lib/links";
import { requestOrigin } from "@/lib/request";

export const metadata: Metadata = { title: "Detail link" };
export const dynamic = "force-dynamic";

const STATUS_LABEL = { aktif: "Aktif", nonaktif: "Nonaktif", kedaluwarsa: "Kedaluwarsa" } as const;
const tz = "Asia/Jakarta";
const fmtDate = (t: number) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: tz }).format(t);
const fmtShort = (iso: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

function lastClickText(t: number | null) {
  if (!t) return "Belum pernah";
  const day = (x: number) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(x);
  const time = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(t);
  if (day(t) === day(Date.now())) return `Hari ini, ${time}`;
  if (day(t) === day(Date.now() - 86400_000)) return `Kemarin, ${time}`;
  return `${fmtDate(t)}, ${time}`;
}

export default async function DetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getLink(slug);
  if (!link) notFound();
  const [stats, { origin }] = await Promise.all([getStats(link.slug), requestOrigin()]);
  const d = dto(link);
  const host = origin.replace(/^https?:\/\//, "");
  const peak = Math.max(1, stats.peak);
  const maxOf = (rows: { n: number }[]) => Math.max(1, ...rows.map((r) => r.n));

  return (
    <main className="page" style={{ gap: 22 }}>
      <Link href="/admin" className="back"><IconBack />Balik ke daftar</Link>

      <section className="card" style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0, flex: "1 1 420px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="row" style={{ gap: 10 }}>
            <h1 style={{ fontSize: 32, lineHeight: 1.2 }}>{link.title || link.slug}</h1>
            <span className={`badge ${d.status}`}>{STATUS_LABEL[d.status]}</span>
          </div>
          <p className="mono" style={{ margin: 0, fontSize: 18, color: "var(--merah-tua)" }}>{host}/{link.slug}</p>
          <p className="muted" style={{ margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={link.targetUrl}>→ {link.targetUrl}</p>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Dibuat {fmtDate(link.createdAt)} · {link.expiresAt ? `Kedaluwarsa ${fmtDate(link.expiresAt)}` : "Tanpa kedaluwarsa"}
          </p>
        </div>
        <LinkActions link={d} origin={origin} />
      </section>

      <div className="tiles">
        <div className="tile"><div className="tile-label">Total klik</div><div className="tile-num">{link.clicks.toLocaleString("id-ID")}</div></div>
        <div className="tile"><div className="tile-label">7 hari terakhir</div><div className="tile-num">{stats.last7.toLocaleString("id-ID")}</div></div>
        <div className="tile"><div className="tile-label">Terakhir diklik</div><div className="tile-text">{lastClickText(link.lastClickedAt)}</div></div>
      </div>

      <section aria-labelledby="grafik" className="card stack" style={{ padding: 24 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 id="grafik" style={{ fontSize: 21 }}>Klik per hari</h2>
          <span className="muted" style={{ fontSize: 14 }}>30 hari terakhir · puncak {stats.peak} klik</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div className="bars" role="img" aria-label={`Grafik klik per hari selama 30 hari, total ${stats.days.reduce((a, b) => a + b.clicks, 0)} klik`}>
            {stats.days.map((x, i) => (
              <div key={x.date} className={`bar${i === stats.days.length - 1 ? " today" : ""}`}
                style={{ height: `${Math.max(1, Math.round((x.clicks / peak) * 100))}%` }}
                title={`${fmtShort(x.date)}: ${x.clicks} klik`} />
            ))}
          </div>
          <div className="bar-labels">
            <span>{fmtShort(stats.days[0].date)}</span>
            <span>{fmtShort(stats.days[15].date)}</span>
            <span>{fmtShort(stats.days[29].date)}</span>
          </div>
        </div>
      </section>

      <div className="grid-2" style={{ gap: 16 }}>
        {[{ id: "perangkat", title: "Perangkat", rows: stats.devices }, { id: "sumber", title: "Sumber klik", rows: stats.sources }].map((b) => (
          <section key={b.id} aria-labelledby={b.id} className="card stack" style={{ padding: 24, gap: 14 }}>
            <h2 id={b.id} style={{ fontSize: 21 }}>{b.title}</h2>
            {b.rows.length === 0 ? <p className="muted" style={{ margin: 0 }}>Belum ada data.</p> : b.rows.map((r) => (
              <div key={r.label} className="meter">
                <div className="meter-top"><span style={{ fontWeight: 500 }}>{r.label}</span><span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>{r.n.toLocaleString("id-ID")}</span></div>
                <div className="meter-track"><div className="meter-fill" style={{ width: `${Math.round((r.n / maxOf(b.rows)) * 100)}%` }} /></div>
              </div>
            ))}
          </section>
        ))}
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>
        Klik dari pratinjau WhatsApp/Telegram dan robot mesin pencari kagak dihitung. Sumber "Langsung / QR" artinya dibuka tanpa asal halaman (scan QR, ketik manual, atau dari aplikasi).
      </p>
    </main>
  );
}
