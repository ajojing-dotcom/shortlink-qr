import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav, TopNav } from "@/components/AdminNav";
import { BrandMark, BrandName, GigiBalang } from "@/components/Brand";
import { isLoggedIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isLoggedIn())) redirect("/login");
  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/admin" className="brand">
            <BrandMark />
            <BrandName />
          </Link>
          <TopNav />
        </div>
      </header>
      <GigiBalang id="gb-head" />
      {children}
      <BottomNav />
    </>
  );
}
