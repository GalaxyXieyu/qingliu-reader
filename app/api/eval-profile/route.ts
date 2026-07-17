import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../lib/auth";
import { getActiveProfile, listProfiles, saveProfile } from "../../../lib/topics";

export async function GET(request: Request) {
  try {
    await requireSessionUser(env, request);
    return Response.json({ active: await getActiveProfile(env), versions: await listProfiles(env) });
  } catch (error) {
    return authErrorResponse(error, "读取评估配置失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser(env, request);
    const body = await request.json() as { content?: string; note?: string };
    if (!body.content) throw new Error("content 不能为空");
    return Response.json({ ok: true, ...(await saveProfile(env, body.content, body.note || "")) });
  } catch (error) {
    return authErrorResponse(error, "保存评估配置失败");
  }
}
