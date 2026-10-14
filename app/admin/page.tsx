import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";
import { dto } from "@/lib/api";
import { listLinks } from "@/lib/links";
import { requestOrigin } from "@/lib/request";

export const metadata: Metadata = { title: "Link aye" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [{ origin }, links] = await Promise.all([requestOrigin(), listLinks()]);
  return <Dashboard initial={links.map(dto)} origin={origin} />;
}
