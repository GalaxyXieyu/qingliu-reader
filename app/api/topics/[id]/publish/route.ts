import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../../../lib/auth";
import { publishTopic } from "../../../../../lib/topics";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireSessionUser(env, request);
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw new Error("选题 ID 不合法");
    const body = await request.json() as {
      url?: string; publishedDate?: string;
      reads?: number; likes?: number; collects?: number; shares?: number;
    };
    if (!body.url) throw new Error("url 不能为空");
    await publishTopic(env, id, {
      url: body.url, publishedDate: body.publishedDate,
      reads: body.reads, likes: body.likes, collects: body.collects, shares: body.shares,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return authErrorResponse(error, "发布回填失败");
  }
}
