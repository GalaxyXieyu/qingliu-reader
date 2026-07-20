import { env } from "cloudflare:workers";
import { authErrorResponse, requireSessionUser } from "../../../lib/auth";
import { listSeries, listSeriesTopics, listScheduledTopics } from "../../../lib/topics";

export async function GET(request: Request) {
  try {
    await requireSessionUser(env, request);
    const url = new URL(request.url);
    const name = url.searchParams.get("name");
    const calendar = url.searchParams.get("calendar");
    if (name) return Response.json({ topics: await listSeriesTopics(env, name) });
    if (calendar) {
      const [from, to] = calendar === "week"
        ? [new Date().toISOString().slice(0, 10), new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)]
        : [`${calendar}-01`, `${calendar}-31`];
      return Response.json({ topics: await listScheduledTopics(env, from, to) });
    }
    return Response.json({ series: await listSeries(env) });
  } catch (error) {
    return authErrorResponse(error, "读取系列失败");
  }
}
