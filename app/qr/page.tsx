import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PublicShell from "@/components/PublicShell";
import QrStudio from "@/components/QrStudio";
import { isLoggedIn } from "@/lib/auth";
import { publicModeOn } from "@/lib/guest";
import { requestOrigin } from "@/lib/request";

export const metadata: Metadata = { title: "QR Generator" };
export const dynamic = "force-dynamic";

// QR generator publik (tanpa login).
export default async function PublicQrPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const [{ d }, loggedIn, { origin }] = await Promise.all([searchParams, isLoggedIn(), requestOrigin()]);
  if (!publicModeOn()) redirect(loggedIn ? `/admin/qr${d ? `?d=${encodeURIComponent(d)}` : ""}` : "/login");
  return (
    <PublicShell active="qr" loggedIn={loggedIn}>
      <QrStudio initialData={d ?? `${origin}/`} links={[]} />
    </PublicShell>
  );
}
