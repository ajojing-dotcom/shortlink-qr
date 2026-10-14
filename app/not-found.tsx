import type { Metadata } from "next";
import { GigiBalang } from "@/components/Brand";
import CurrentPath from "@/components/CurrentPath";

export const metadata: Metadata = { title: "Link kagak ketemu" };

export default function NotFound() {
  return (
    <main className="solo" style={{ background: "var(--surface)" }}>
      <div className="solo-gigi"><GigiBalang id="gb-404" /></div>
      <div className="nf">
        <div aria-hidden="true" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="nf-num">404</span>
          <span className="nf-mark">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M10 14a4 4 0 0 0 5.7 0l1-1" /><path d="M14 10a4 4 0 0 0-5.7 0l-1 1" /><path d="M18.5 5.5l-2 2M5.5 18.5l2-2" />
            </svg>
          </span>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.2 }}>Waduh, linknya kagak ketemu!</h1>
          <p className="muted" style={{ margin: 0 }}>
            Link <CurrentPath /> kali aje salah ketik, udah kedaluwarsa, atau dimatiin sama yang punya.
          </p>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Coba tanya lagi ke yang ngebagiin linknya, ye.</p>
      </div>
    </main>
  );
}
