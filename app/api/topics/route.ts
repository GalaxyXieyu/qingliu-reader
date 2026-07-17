import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../lib/auth";
import { listTopics, setTopicStatus } from "../../../lib/topics";

export async function GET(request: Request) {
  try {
    await requireSessionUser(env, request);
    const status = new URL(request.url).searchParams.get("status") || "";
    return Response.json({ topics: await listTopics(env, status) });
  } catch (error) {
    return authErrorResponse(error, "读取选题失败");
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser(env, request);
    const body = await request.json() as { action?: "approve" | "skip" | "restore"; id?: number };
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error("选题 ID 不合法");
    const status = body.action === "approve" ? "approved" : body.action === "skip" ? "skipped" : "candidate";
    await setTopicStatus(env, id, status);
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error, "更新选题失败");
  }
}
