import { env } from "cloudflare:workers";
import { requireImportAccess } from "../_access";
import { getActiveProfile, listUnevaluated, recordEvaluation } from "../../../lib/topics";

export async function GET(request: Request) {
  try {
    const denied = requireImportAccess(request, env);
    if (denied) return denied;
    const limit = Number(new URL(request.url).searchParams.get("limit")) || 50;
    const profile = await getActiveProfile(env);
    return Response.json({ items: await listUnevaluated(env, limit), profile });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取待评估失败" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const denied = requireImportAccess(request, env);
    if (denied) return denied;
    const body = await request.json() as { evaluations?: Array<Parameters<typeof recordEvaluation>[1]> };
    let recorded = 0, topics = 0;
    for (const e of body.evaluations || []) {
      const r = await recordEvaluation(env, e);
      recorded += 1;
      if (r.topicCreated) topics += 1;
    }
    return Response.json({ ok: true, recorded, topicsCreated: topics });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "写入评估失败" }, { status: 400 });
  }
}
