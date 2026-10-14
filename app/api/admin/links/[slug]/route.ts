import type { NextRequest } from "next/server";
import { dto, errorResponse, guard, json } from "@/lib/api";
import { deleteLink, getLink, updateLink, type UpdateInput } from "@/lib/links";
import { requestOrigin } from "@/lib/request";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { slug } = await params;
    const body = (await req.json()) as UpdateInput;
    const { host } = await requestOrigin();
    const patch: UpdateInput = {};
    if (typeof body.url === "string") patch.url = body.url;
    if (typeof body.slug === "string") patch.slug = body.slug;
    if (typeof body.title === "string") patch.title = body.title;
    if (body.expiresAt !== undefined) patch.expiresAt = body.expiresAt;
    if (typeof body.active === "boolean") patch.active = body.active;
    return json({ link: dto(await updateLink(slug, patch, [host])) });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { slug } = await params;
    if (!(await getLink(slug))) return json({ error: "Link tidak ditemukan." }, 404);
    await deleteLink(slug);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
