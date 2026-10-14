import { redirect } from "next/navigation";
import { BrandHero } from "@/components/Brand";
import GuestPanel from "@/components/GuestPanel";
import PublicShell from "@/components/PublicShell";
import { isLoggedIn } from "@/lib/auth";
import { guestDays, publicModeOn } from "@/lib/guest";
import { requestOrigin } from "@/lib/request";

export const dynamic = "force-dynamic";

export default async function Home() {
  const loggedIn = await isLoggedIn();
  if (!publicModeOn()) redirect(loggedIn ? "/admin" : "/login");
  const { origin } = await requestOrigin();
  const days = guestDays();

  return (
    <PublicShell active="home" loggedIn={loggedIn}>
      <main className="page pub-page">
        <section className="pub-hero">
          <div className="pub-hero-text">
            <h1>Link panjang jadi pendek, langsung sama QR-nya.</h1>
            <p>Tanpa daftar, tanpa login. Tempel link, klik, bagiin.</p>
          </div>
          <div className="pub-hero-art"><BrandHero width={420} /></div>
        </section>

        <GuestPanel origin={origin} days={days} loggedIn={loggedIn} />

        <div className="info-cards">
          <div className="card info">
            <b>Tanpa login</b>
            <span className="muted">Nama acak atau bikin sendiri, aktif {days} hari, QR siap unduh, jumlah klik lewat link kelola.</span>
          </div>
          <div className="card info">
            <b>Dengan login</b>
            <span className="muted">Link permanen, ganti tujuan kapan aje, statistik 30 hari, ekspor CSV.</span>
          </div>
          <div className="card info">
            <b>Aman dari link jahat</b>
            <span className="muted">Link dicek dulu. Link penipuan diblokir dan bisa dilaporin.</span>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
