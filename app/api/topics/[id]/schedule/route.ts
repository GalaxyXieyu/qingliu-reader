import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../../../lib/auth";
import { updateTopic, checkScheduleConflict } from "../../../../../lib/topics";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSessionUser(env, request);
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error("选题 ID 不合法");
    const body = await request.json() as { date?: string };
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) throw new Error("日期格式应为 YYYY-MM-DD");
    const conflict = await checkScheduleConflict(env, body.date, id);
    if (conflict) throw new Error(`该日期已有 GZH 排期：${conflict}`);
    await updateTopic(env, id, { scheduledDate: body.date, status: "scheduled" });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error, "排期失败");
  }
}
