import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../lib/auth";
import { listRetrospectives, createRetrospective } from "../../../lib/topics";

export async function GET(request: Request) {
  try {
    await requireSessionUser(env, request);
    const url = new URL(request.url);
    const includeHistory = url.searchParams.get("history") === "1";
    return Response.json({ retrospectives: await listRetrospectives(env, includeHistory) });
  } catch (error) {
    return authErrorResponse(error, "读取复盘失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser(env, request);
    const body = await request.json();
    return Response.json({ ok: true, ...(await createRetrospective(env, body)) });
  } catch (error) {
    return authErrorResponse(error, "创建复盘失败");
  }
}
