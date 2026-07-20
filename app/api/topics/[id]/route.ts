import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../../lib/auth";
import { updateTopic } from "../../../../lib/topics";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSessionUser(env, request);
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error("选题 ID 不合法");
    const body = await request.json();
    await updateTopic(env, id, body);
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error, "更新选题失败");
  }
}
