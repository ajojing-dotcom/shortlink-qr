import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import ReportForm from "@/components/ReportForm";
import { isLoggedIn } from "@/lib/auth";
import { requestOrigin } from "@/lib/request";

export const metadata: Metadata = { title: "Laporkan link berbahaya" };
export const dynamic = "force-dynamic";

export default async function LaporPage({ searchParams }: { searchParams: Promise<{ link?: string }> }) {
  const [{ link }, loggedIn, { origin }] = await Promise.all([searchParams, isLoggedIn(), requestOrigin()]);
  return (
    <PublicShell loggedIn={loggedIn}>
      <main className="page" style={{ maxWidth: 640 }}>
        <div className="page-head">
          <h1>Laporin link berbahaya</h1>
          <p>Nemu shortlink dari sini yang ngarah ke penipuan, judi, atau virus? Kasih tau kite, nanti langsung dicek dan dimatiin.</p>
        </div>
        <ReportForm initial={link ?? ""} host={origin.replace(/^https?:\/\//, "")} />
      </main>
    </PublicShell>
  );
}
