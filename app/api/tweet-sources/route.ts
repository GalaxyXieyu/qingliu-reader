import { env } from "cloudflare:workers";
import { requireImportAccess } from "../_access";
import { ensureSchema } from "../../../lib/store";

export async function GET(request: Request) {
  try {
    const denied = requireImportAccess(request, env);
    if (denied) return denied;
    await ensureSchema(env.DB);
    const rows = await env.DB.prepare("SELECT id, name, url FROM sources WHERE kind = 'x-tweet' AND enabled = 1 ORDER BY id").all<{ id: number; name: string; url: string }>();
    const sources = rows.results.map((r) => ({
      sourceId: r.id,
      name: r.name,
      handle: String(r.url || "").replace(/^x-tweets:\/\//, ""),
    })).filter((r) => r.handle);
    return Response.json({ sources });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取推文源失败" }, { status: 400 });
  }
}
