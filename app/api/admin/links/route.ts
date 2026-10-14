import type { NextRequest } from "next/server";
import { dto, errorResponse, guard, json } from "@/lib/api";
import { createLink, listLinks } from "@/lib/links";
import { requestOrigin } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    return json({ links: (await listLinks()).map(dto) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const body = (await req.json()) as { url?: string; slug?: string; title?: string; expiresAt?: string | null };
    const { host } = await requestOrigin();
    const link = await createLink(
      { url: body.url ?? "", slug: body.slug, title: body.title, expiresAt: body.expiresAt },
      [host]
    );
    return json({ link: dto(link) }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
