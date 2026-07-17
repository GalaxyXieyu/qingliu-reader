import { env } from "cloudflare:workers";
import { authErrorResponse, createApiToken, listApiTokens, requireSessionUser, revokeApiToken } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireSessionUser(env, request);
    return Response.json({ tokens: await listApiTokens(env, user.id) });
  } catch (error) {
    return authErrorResponse(error, "读取 API Key 失败");
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser(env, request);
    const body = await request.json() as { name?: string };
    const created = await createApiToken(env, user.id, body.name || "cli");
    return Response.json({ ok: true, ...created });
  } catch (error) {
    return authErrorResponse(error, "创建 API Key 失败");
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireSessionUser(env, request);
    const body = await request.json() as { id?: number };
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error("Key ID 不合法");
    await revokeApiToken(env, user.id, id);
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error, "撤销 API Key 失败");
  }
}
