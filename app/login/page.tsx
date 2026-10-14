import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark, GigiBalang } from "@/components/Brand";
import { isLoggedIn } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await isLoggedIn()) redirect("/admin");
  return (
    <main className="solo">
      <div className="solo-gigi"><GigiBalang id="gb-login" /></div>
      <section aria-labelledby="masuk" className="solo-card">
        <BrandMark size={44} />
        <div>
          <h1 id="masuk" style={{ fontSize: 30, lineHeight: 1.15 }}>Masuk dulu, Bang</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Halaman ini khusus yang punya. Link pendeknya mah bisa dibuka siape aje.
          </p>
        </div>
        <LoginForm next={next ?? "/admin"} />
      </section>
    </main>
  );
}
