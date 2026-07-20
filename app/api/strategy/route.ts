import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../lib/auth";
import { getActiveStrategy, saveStrategy } from "../../../lib/topics";

export async function GET(request: Request) {
  try {
    await requireSessionUser(env, request);
    const active = await getActiveStrategy(env);
    const url = new URL(request.url);
    const platform = url.searchParams.get("platform");
    const section = url.searchParams.get("section");
    const parsed = JSON.parse(String(active.content));
    let data: unknown = parsed;
    if (platform) {
      const key = platform === "gzh" ? "wechat_gzh" : platform === "xhs" ? "xiaohongshu" : platform;
      data = (parsed as Record<string, unknown>).platforms
        ? ((parsed as Record<string, Record<string, unknown>>).platforms as Record<string, unknown>)[key] ?? null
        : null;
    } else if (section) {
      data = (parsed as Record<string, unknown>)[section] ?? null;
    }
    return Response.json({ version: active.version, note: active.note, data });
  } catch (error) {
    return authErrorResponse(error, "读取策略失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser(env, request);
    const body = await request.json() as { content?: string; note?: string };
    if (!body.content) throw new Error("content 不能为空");
    return Response.json({ ok: true, ...(await saveStrategy(env, body.content, body.note || "")) });
  } catch (error) {
    return authErrorResponse(error, "保存策略失败");
  }
}
