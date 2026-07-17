import { ensureSchema } from "./store";

type Env = { DB: D1Database };

const now = () => new Date().toISOString();

export const DEFAULT_PROFILE = {
  model: "gpt-5.4-mini",
  keywords: ["agent", "llm", "rag", "claude", "gpt", "gemini", "mcp", "cursor", "copilot", "vibe", "workflow",
    "多模态", "大模型", "智能体", "微调", "检索", "提示词", "aigc", "生图", "编程", "开发", "工程", "评测", "开源"],
  prompt: `## 我的内容方向
- AI Agent 工程化（LangGraph、多Agent协作、Harness框架）
- AIGC 工具使用（生图、设计工作流）
- AI 编程工作流（VibeCoding、Cursor、Claude Code）
- AI 产品评测与分析

## 评分标准（各 0-3 分）
- 热度：0=无人关注 1=小圈子 2=平台热点 3=全网热搜
- 匹配度：0=跑题 1=沾边 2=相关 3=正中我的方向
- 可执行性：0=需大量调研 1=需2天以上 2=一天内可出 3=现成素材直接出

## HKR 预判
H=Hook（标题能让人想点开吗）K=Knowledge（有信息增量吗）R=Resonance（能戳中情绪/共鸣吗）

## 产出要求
若值得做（总分≥6），给出：具体可执行的选题标题（不是原文标题）、1-2 个切入角度、推荐平台（公众号/小红书/B站/X 选一）、内容类型（连载/工具/热点/产品 选一）、一句话理由。`,
};

export async function getActiveProfile(env: Env) {
  await ensureSchema(env.DB);
  const row = await env.DB.prepare("SELECT id, version, content, note, created_at AS createdAt FROM eval_profiles WHERE is_active = 1 ORDER BY id DESC LIMIT 1").first<Record<string, unknown>>();
  if (row) return row;
  const content = JSON.stringify(DEFAULT_PROFILE);
  await env.DB.prepare("INSERT INTO eval_profiles (version, content, note, is_active, created_at) VALUES (1, ?, '初始版本', 1, ?)").bind(content, now()).run();
  return { id: 1, version: 1, content, note: "初始版本", createdAt: now() };
}

export async function saveProfile(env: Env, content: string, note: string) {
  await ensureSchema(env.DB);
  JSON.parse(content);
  const max = await env.DB.prepare("SELECT COALESCE(MAX(version), 0) AS v FROM eval_profiles").first<{ v: number }>();
  const version = Number(max?.v || 0) + 1;
  await env.DB.batch([
    env.DB.prepare("UPDATE eval_profiles SET is_active = 0"),
    env.DB.prepare("INSERT INTO eval_profiles (version, content, note, is_active, created_at) VALUES (?, ?, ?, 1, ?)").bind(version, content, (note || "").slice(0, 200), now()),
  ]);
  return { version };
}

export async function listProfiles(env: Env) {
  await ensureSchema(env.DB);
  const rows = await env.DB.prepare("SELECT id, version, note, is_active AS isActive, created_at AS createdAt FROM eval_profiles ORDER BY version DESC LIMIT 30").all();
  return rows.results;
}

export async function listUnevaluated(env: Env, limit: number) {
  await ensureSchema(env.DB);
  const rows = await env.DB.prepare(`SELECT i.id, i.kind, i.title, i.author, i.original_excerpt AS excerpt,
      substr(COALESCE(i.content_markdown, i.original_excerpt, ''), 1, 3000) AS content,
      i.url, i.published_at AS publishedAt, s.name AS sourceName
    FROM items i LEFT JOIN item_evaluations e ON e.item_id = i.id LEFT JOIN sources s ON s.id = i.source_id
    WHERE e.item_id IS NULL ORDER BY i.id DESC LIMIT ?`).bind(Math.min(Math.max(limit, 1), 100)).all();
  return rows.results;
}

type EvalPayload = {
  itemId: number; heat: number; match: number; feasibility: number; verdict: string; hkr?: string; model?: string;
  title?: string; angle?: string; reason?: string; platform?: string; contentType?: string;
};

export async function recordEvaluation(env: Env, e: EvalPayload) {
  await ensureSchema(env.DB);
  const total = Number(e.heat || 0) + Number(e.match || 0) + Number(e.feasibility || 0);
  await env.DB.prepare(`INSERT INTO item_evaluations (item_id, heat, match_score, feasibility, total, verdict, hkr, model, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(item_id) DO UPDATE SET heat=excluded.heat, match_score=excluded.match_score,
      feasibility=excluded.feasibility, total=excluded.total, verdict=excluded.verdict, hkr=excluded.hkr, model=excluded.model`)
    .bind(e.itemId, e.heat || 0, e.match || 0, e.feasibility || 0, total, e.verdict, e.hkr || "", e.model || "", now()).run();
  if (total >= 6 && e.verdict === "ok" && e.title && e.angle) {
    await env.DB.prepare(`INSERT INTO topics (title, angle, reason, platform, content_type, heat, match_score, feasibility, total, hkr, status, item_ids, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'candidate', ?, ?, ?)`)
      .bind(e.title.slice(0, 120), e.angle.slice(0, 500), (e.reason || "").slice(0, 300), e.platform || "", e.contentType || "",
        e.heat || 0, e.match || 0, e.feasibility || 0, total, e.hkr || "", JSON.stringify([e.itemId]), now(), now()).run();
    return { total, topicCreated: true };
  }
  return { total, topicCreated: false };
}

export async function listTopics(env: Env, status: string) {
  await ensureSchema(env.DB);
  const rows = await env.DB.prepare(`SELECT id, title, angle, reason, platform, content_type AS contentType, heat,
      match_score AS matchScore, feasibility, total, hkr, status, item_ids AS itemIds, created_at AS createdAt, updated_at AS updatedAt
    FROM topics WHERE (? = '' OR status = ?) ORDER BY total DESC, id DESC LIMIT 100`).bind(status, status).all();
  return rows.results;
}

export async function setTopicStatus(env: Env, id: number, status: string) {
  await ensureSchema(env.DB);
  if (!["candidate", "approved", "skipped"].includes(status)) throw new Error("状态不合法");
  await env.DB.prepare("UPDATE topics SET status = ?, updated_at = ? WHERE id = ?").bind(status, now(), id).run();
}

export async function importTweets(env: Env, author: string, handle: string,
  tweets: Array<{ url: string; text: string; publishedAt?: string; heat?: string }>) {
  await ensureSchema(env.DB);
  const sourceUrl = "x-tweets://" + (handle || author);
  let source = await env.DB.prepare("SELECT id FROM sources WHERE url = ?").bind(sourceUrl).first<{ id: number }>();
  if (!source) {
    await env.DB.prepare("INSERT INTO sources (kind, category, name, url, enabled, created_at) VALUES ('x', 'ai', ?, ?, 1, ?)")
      .bind((author || handle) + "·推文", sourceUrl, now()).run();
    source = await env.DB.prepare("SELECT id FROM sources WHERE url = ?").bind(sourceUrl).first<{ id: number }>();
  }
  let added = 0;
  for (const t of tweets || []) {
    if (!t.url || !t.text) continue;
    const title = t.text.split("\n")[0].slice(0, 120) || "(推文)";
    const body = t.text + (t.heat ? "\n\n> 互动: " + t.heat : "");
    const result = await env.DB.prepare(`INSERT OR IGNORE INTO items (source_id, kind, title, original_excerpt, content_markdown, author, url, published_at, language, status, created_at)
        VALUES (?, 'tweet', ?, ?, ?, ?, ?, ?, 'auto', 'ready', ?)`)
      .bind(source!.id, title, t.text.slice(0, 500), body, author || handle, t.url, t.publishedAt || null, now()).run();
    if (result.meta.changes > 0) added += 1;
  }
  await env.DB.prepare("UPDATE sources SET last_synced_at = ? WHERE id = ?").bind(now(), source!.id).run();
  return added;
}
