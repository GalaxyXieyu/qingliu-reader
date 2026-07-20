"use client";

import { useState, useCallback } from "react";
import { TopicCard } from "./TopicCard";
import { TopicDrawer } from "./TopicDrawer";

export type Topic = {
  id: number;
  title: string;
  angle: string | null;
  reason: string | null;
  platform: string | null;
  contentType: string | null;
  series: string | null;
  seriesOrder: number | null;
  scheduledDate: string | null;
  notes: string | null;
  heat: number;
  matchScore: number;
  feasibility: number;
  total: number;
  hkr: string | null;
  status: string;
  itemIds: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type ColumnConfig = {
  key: string;
  label: string;
  emoji: string;
  statuses: string[];
  accent: string;
};

const COLUMNS: ColumnConfig[] = [
  { key: "candidate", label: "候选", emoji: "📥", statuses: ["candidate"], accent: "border-t-blue-400" },
  { key: "approved", label: "入选", emoji: "✅", statuses: ["approved"], accent: "border-t-green-400" },
  { key: "scheduled", label: "排期中", emoji: "📅", statuses: ["scheduled"], accent: "border-t-amber-400" },
  { key: "published", label: "已发布", emoji: "🚀", statuses: ["published"], accent: "border-t-purple-400" },
];

const PLATFORM_LABELS: Record<string, string> = {
  gzh: "公众号",
  wechat_gzh: "公众号",
  xhs: "小红书",
  xiaohongshu: "小红书",
  x: "X",
  "x-tweet": "X",
  bilibili: "B站",
  b: "B站",
};

export function platformLabel(platform: string | null): string {
  if (!platform) return "未指定";
  return PLATFORM_LABELS[platform] || platform;
}

export function Board({ topics: initialTopics }: { topics: Topic[] }) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const selectedTopic = topics.find((t) => t.id === selectedId) ?? null;

  const showToast = useCallback((kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const updateTopicInState = useCallback((id: number, patch: Partial<Topic>) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const handleSave = useCallback(async (id: number, patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "保存失败");
      }
      updateTopicInState(id, patch as Partial<Topic>);
      showToast("ok", "已保存");
    } catch (e) {
      showToast("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [updateTopicInState, showToast]);

  const handleAction = useCallback(async (id: number, action: "approve" | "skip" | "unschedule") => {
    setSaving(true);
    try {
      if (action === "unschedule") {
        const res = await fetch(`/api/topics/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scheduledDate: null, status: "approved" }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "取消排期失败");
        }
        updateTopicInState(id, { scheduledDate: null, status: "approved" });
        showToast("ok", "已取消排期");
      } else {
        const res = await fetch(`/api/topics`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "操作失败");
        }
        const newStatus = action === "approve" ? "approved" : "skipped";
        updateTopicInState(id, { status: newStatus });
        showToast("ok", action === "approve" ? "已入选" : "已跳过");
      }
    } catch (e) {
      showToast("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [updateTopicInState, showToast]);

  const handleSchedule = useCallback(async (id: number, date: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/topics/${id}/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "排期失败");
      }
      updateTopicInState(id, { scheduledDate: date, status: "scheduled" });
      showToast("ok", `已排期至 ${date}`);
    } catch (e) {
      showToast("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [updateTopicInState, showToast]);

  const handlePublish = useCallback(async (id: number, data: { url: string; publishedDate?: string; reads?: number; likes?: number; collects?: number; shares?: number }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/topics/${id}/publish`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "发布回填失败");
      }
      updateTopicInState(id, { status: "published" });
      showToast("ok", "已发布回填");
    } catch (e) {
      showToast("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [updateTopicInState, showToast]);

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-20 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${toast.kind === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Board */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const colTopics = topics.filter((t) => col.statuses.includes(t.status));
          return (
            <div key={col.key} className={`flex flex-col rounded-xl border border-t-4 ${col.accent} border-[var(--line)] bg-[var(--sidebar)]/50`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.emoji}</span>
                  <span className="text-sm font-bold">{col.label}</span>
                </div>
                <span className="rounded-full bg-[var(--canvas)] px-2 py-0.5 text-xs font-bold text-[var(--muted)]">{colTopics.length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 200px)" }}>
                {colTopics.length === 0 && (
                  <div className="flex h-20 items-center justify-center text-xs text-[var(--faint)]">暂无选题</div>
                )}
                {colTopics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} onClick={() => setSelectedId(topic.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer */}
      {selectedTopic && (
        <TopicDrawer
          topic={selectedTopic}
          saving={saving}
          onClose={() => setSelectedId(null)}
          onSave={(patch) => handleSave(selectedTopic.id, patch)}
          onAction={(action) => handleAction(selectedTopic.id, action)}
          onSchedule={(date) => handleSchedule(selectedTopic.id, date)}
          onPublish={(data) => handlePublish(selectedTopic.id, data)}
        />
      )}
    </div>
  );
}
