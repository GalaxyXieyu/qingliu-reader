import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../../lib/auth";
import { reviseRetrospective, getRetrospectiveHistory } from "../../../../lib/topics";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSessionUser(env, request);
    const url = new URL(request.url);
    const title = url.searchParams.get("title");
    if (!title) throw new Error("请提供 title 参数");
    return Response.json({ history: await getRetrospectiveHistory(env, title) });
  } catch (error) {
    return authErrorResponse(error, "读取复盘历史失败");
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSessionUser(env, request);
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error("复盘 ID 不合法");
    const body = await request.json();
    return Response.json({ ok: true, ...(await reviseRetrospective(env, id, body)) });
  } catch (error) {
    return authErrorResponse(error, "修订复盘失败");
  }
}
