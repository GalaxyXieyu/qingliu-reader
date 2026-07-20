import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../../lib/auth";
import { listStrategyVersions, activateStrategyVersion } from "../../../../lib/topics";

export async function GET(request: Request) {
  try {
    await requireSessionUser(env, request);
    return Response.json({ versions: await listStrategyVersions(env) });
  } catch (error) {
    return authErrorResponse(error, "读取策略版本失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser(env, request);
    const body = await request.json() as { version?: number };
    if (!Number.isInteger(body.version)) throw new Error("version 必须是整数");
    await activateStrategyVersion(env, body.version!);
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error, "切换策略版本失败");
  }
}
