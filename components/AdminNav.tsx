"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLink, IconLogout, IconQr } from "./Icons";

function useActive() {
  const path = usePathname() ?? "";
  return (key: "link" | "qr") => {
    const on = key === "qr" ? path.startsWith("/admin/qr") : path === "/admin" || path.startsWith("/admin/link");
    return on ? ("page" as const) : undefined;
  };
}

export function TopNav() {
  const active = useActive();
  return (
    <nav aria-label="Menu utama" className="nav">
      <Link href="/admin" aria-current={active("link")}>Link aye</Link>
      <Link href="/admin/qr" aria-current={active("qr")}>QR Generator</Link>
      <form action="/logout" method="post" style={{ margin: 0 }}>
        <button type="submit">Keluar</button>
      </form>
    </nav>
  );
}

export function BottomNav() {
  const active = useActive();
  return (
    <nav aria-label="Menu bawah" className="bottomnav">
      <Link href="/admin" aria-current={active("link")}><IconLink size={22} />Link</Link>
      <Link href="/admin/qr" aria-current={active("qr")}><IconQr size={22} />QR</Link>
      <form action="/logout" method="post" style={{ margin: 0, display: "contents" }}>
        <button type="submit"><IconLogout />Keluar</button>
      </form>
    </nav>
  );
}
