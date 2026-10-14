import type { Metadata } from "next";
import Link from "next/link";
import ManageGuest from "@/components/ManageGuest";
import PublicShell from "@/components/PublicShell";
import { isLoggedIn } from "@/lib/auth";
import { getGuestLinkWithKey, publicView } from "@/lib/guest";
import { requestOrigin } from "@/lib/request";

export const metadata: Metadata = { title: "Kelola link", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function KelolaPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ kunci?: string }> }) {
  const [{ slug }, { kunci }, loggedIn, { origin }] = await Promise.all([params, searchParams, isLoggedIn(), requestOrigin()]);
  const link = await getGuestLinkWithKey(slug, kunci ?? "").catch(() => null);
  return (
    <PublicShell loggedIn={loggedIn}>
      <main className="page" style={{ maxWidth: 720 }}>
        {link ? (
          <ManageGuest link={publicView(link)} kunci={kunci ?? ""} origin={origin} />
        ) : (
          <section className="card stack">
            <h1 style={{ fontSize: 28 }}>Waduh, kagak bisa dibuka</h1>
            <p className="muted" style={{ margin: 0 }}>Link-nya udah dihapus, atau kunci kelolanya salah. Pastikan Abang nyalin link kelola secara lengkap.</p>
            <Link className="btn" href="/" style={{ alignSelf: "flex-start" }}>Ke beranda</Link>
          </section>
        )}
      </main>
    </PublicShell>
  );
}
