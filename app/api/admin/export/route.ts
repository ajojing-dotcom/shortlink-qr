import { errorResponse, guard } from "@/lib/api";
import { dayKey, listLinks, toCsv } from "@/lib/links";
import { requestOrigin } from "@/lib/request";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  try {
    const { origin } = await requestOrigin();
    const csv = toCsv(await listLinks(), origin);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="klikaje-link-${dayKey()}.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
