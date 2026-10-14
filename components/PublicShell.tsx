import Link from "next/link";
import { BrandMark, BrandName, GigiBalang } from "./Brand";

/** Kerangka halaman publik (tanpa login). */
export default function PublicShell({ active, loggedIn, children }: { active?: "home" | "qr"; loggedIn: boolean; children: React.ReactNode }) {
  const cur = (k: "home" | "qr") => (active === k ? ("page" as const) : undefined);
  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/" className="brand">
            <BrandMark />
            <BrandName />
          </Link>
          <nav aria-label="Menu utama" className="nav nav-public">
            <Link href="/" aria-current={cur("home")}>Shortlink</Link>
            <Link href="/qr" aria-current={cur("qr")}>QR Generator</Link>
            <Link href={loggedIn ? "/admin" : "/login"} className="btn" style={{ height: 40, marginLeft: 6 }}>
              {loggedIn ? "Ke dashboard" : "Masuk"}
            </Link>
          </nav>
        </div>
      </header>
      <GigiBalang id="gb-pub" />
      {children}
      <footer className="pub-foot">
        <span>klikaje · shortlink &amp; QR ala Betawi</span>
        <span><Link href="/lapor">Laporkan link berbahaya</Link></span>
      </footer>
    </>
  );
}
