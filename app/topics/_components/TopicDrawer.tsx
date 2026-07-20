"use client";

import { useState, useEffect } from "react";
import type { Topic } from "./Board";
import { platformLabel } from "./Board";

type PublishData = {
  url: string;
  publishedDate?: string;
  reads?: number;
  likes?: number;
  collects?: number;
  shares?: number;
};

export function TopicDrawer({
  topic,
  saving,
  onClose,
  onSave,
  onAction,
  onSchedule,
  onPublish,
}: {
  topic: Topic;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => void;
  onAction: (action: "approve" | "skip" | "unschedule") => void;
  onSchedule: (date: string) => void;
  onPublish: (data: PublishData) => void;
}) {
  const [form, setForm] = useState({
    title: topic.title || "",
    angle: topic.angle || "",
    platform: topic.platform || "",
    contentType: topic.contentType || "",
    series: topic.series || "",
    seriesOrder: topic.seriesOrder?.toString() || "",
    scheduledDate: topic.scheduledDate || "",
    notes: topic.notes || "",
  });

  const [scheduleDate, setScheduleDate] = useState("");
  const [publishForm, setPublishForm] = useState<PublishData>({
    url: "",
    publishedDate: "",
    reads: 0,
    likes: 0,
    collects: 0,
    shares: 0,
  });
  const [showPublish, setShowPublish] = useState(false);

  // Sync form when topic changes
  useEffect(() => {
    setForm({
      title: topic.title || "",
      angle: topic.angle || "",
      platform: topic.platform || "",
      contentType: topic.contentType || "",
      series: topic.series || "",
      seriesOrder: topic.seriesOrder?.toString() || "",
      scheduledDate: topic.scheduledDate || "",
      notes: topic.notes || "",
    });
  }, [topic.id, topic.title, topic.angle, topic.platform, topic.contentType, topic.series, topic.seriesOrder, topic.scheduledDate, topic.notes]);

  const update = (key: keyof typeof form, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    const patch: Record<string, unknown> = {
      title: form.title,
      angle: form.angle,
      platform: form.platform,
      contentType: form.contentType,
      series: form.series,
      seriesOrder: form.seriesOrder ? Number(form.seriesOrder) : null,
      notes: form.notes,
    };
    onSave(patch);
  };

  const handleSchedule = () => {
    if (!scheduleDate) return;
    onSchedule(scheduleDate);
    setScheduleDate("");
  };

  const handlePublish = () => {
    if (!publishForm.url) return;
    onPublish(publishForm);
    setShowPublish(false);
    setPublishForm({ url: "", publishedDate: "", reads: 0, likes: 0, collects: 0, shares: 0 });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-96 max-w-full flex-col bg-[var(--paper)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">编辑选题</span>
            <span className="rounded-full bg-[var(--canvas)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">#{topic.id}</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--canvas)]" aria-label="关闭">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--muted)]">标题</label>
            <input
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>

          {/* Angle */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--muted)]">切入角度</label>
            <textarea
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
              rows={2}
              value={form.angle}
              onChange={(e) => update("angle", e.target.value)}
            />
          </div>

          {/* Platform & ContentType */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--muted)]">平台</label>
              <select
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
                value={form.platform}
                onChange={(e) => update("platform", e.target.value)}
              >
                <option value="">未指定</option>
                <option value="gzh">公众号</option>
                <option value="xhs">小红书</option>
                <option value="x">X</option>
                <option value="bilibili">B站</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--muted)]">内容类型</label>
              <select
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
                value={form.contentType}
                onChange={(e) => update("contentType", e.target.value)}
              >
                <option value="">未指定</option>
                <option value="连载">连载</option>
                <option value="工具">工具</option>
                <option value="热点">热点</option>
                <option value="产品">产品</option>
              </select>
            </div>
          </div>

          {/* Series & SeriesOrder */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--muted)]">系列名称</label>
              <input
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
                value={form.series}
                onChange={(e) => update("series", e.target.value)}
                placeholder="如：AI工具测评"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[var(--muted)]">系列序号</label>
              <input
                type="number"
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
                value={form.seriesOrder}
                onChange={(e) => update("seriesOrder", e.target.value)}
                placeholder="如：1"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-bold text-[var(--muted)]">备注</label>
            <textarea
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="写作笔记、参考链接等"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--line)] pt-4">
            {/* Score info */}
            <div className="mb-3 flex items-center gap-3 text-xs">
              <span className="rounded-full bg-green-100 px-2 py-0.5 font-bold text-green-700">总分 {topic.total}</span>
              <span className="text-[var(--muted)]">热度 {topic.heat} · 匹配 {topic.matchScore} · 可行 {topic.feasibility}</span>
              {topic.hkr && <span className="text-[var(--faint)]">{topic.hkr}</span>}
            </div>

            {/* Status actions */}
            <div className="flex flex-wrap gap-2">
              {topic.status === "candidate" && (
                <>
                  <button
                    disabled={saving}
                    onClick={() => onAction("approve")}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    ✅ 入选
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => onAction("skip")}
                    className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                  >
                    ⏭️ 跳过
                  </button>
                </>
              )}
              {topic.status === "approved" && (
                <div className="flex w-full items-center gap-2">
                  <input
                    type="date"
                    className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm outline-none focus:border-[var(--green)]"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                  <button
                    disabled={saving || !scheduleDate}
                    onClick={handleSchedule}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    排期
                  </button>
                </div>
              )}
              {topic.status === "scheduled" && (
                <>
                  <span className="text-xs text-[var(--muted)]">📅 排期：{topic.scheduledDate}</span>
                  <button
                    disabled={saving}
                    onClick={() => onAction("unschedule")}
                    className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-300 disabled:opacity-50"
                  >
                    取消排期
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => setShowPublish(!showPublish)}
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    🚀 发布回填
                  </button>
                </>
              )}
              {topic.status === "published" && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">✅ 已发布</span>
              )}
            </div>

            {/* Publish form */}
            {showPublish && (
              <div className="mt-4 space-y-2 rounded-lg border border-[var(--line)] bg-[var(--canvas)] p-3">
                <div className="text-xs font-bold text-[var(--muted)]">发布回填</div>
                <input
                  className="w-full rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--green)]"
                  placeholder="发布链接 URL"
                  value={publishForm.url}
                  onChange={(e) => setPublishForm((p) => ({ ...p, url: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className="rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--green)]"
                    value={publishForm.publishedDate}
                    onChange={(e) => setPublishForm((p) => ({ ...p, publishedDate: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--green)]"
                    placeholder="阅读数"
                    value={publishForm.reads}
                    onChange={(e) => setPublishForm((p) => ({ ...p, reads: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    className="rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--green)]"
                    placeholder="点赞数"
                    value={publishForm.likes}
                    onChange={(e) => setPublishForm((p) => ({ ...p, likes: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    className="rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--green)]"
                    placeholder="收藏数"
                    value={publishForm.collects}
                    onChange={(e) => setPublishForm((p) => ({ ...p, collects: Number(e.target.value) }))}
                  />
                  <input
                    type="number"
                    className="rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-1.5 text-sm outline-none focus:border-[var(--green)]"
                    placeholder="分享数"
                    value={publishForm.shares}
                    onChange={(e) => setPublishForm((p) => ({ ...p, shares: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={saving || !publishForm.url}
                    onClick={handlePublish}
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    确认发布
                  </button>
                  <button
                    onClick={() => setShowPublish(false)}
                    className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="border-t border-[var(--line)] pt-3 text-[10px] text-[var(--faint)]">
            <div>创建于 {new Date(topic.createdAt).toLocaleString("zh-CN")}</div>
            {topic.updatedAt && <div>更新于 {new Date(topic.updatedAt).toLocaleString("zh-CN")}</div>}
            {topic.reason && <div className="mt-1">理由：{topic.reason}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--line)] px-5 py-3">
          <button
            disabled={saving}
            onClick={handleSave}
            className="w-full rounded-lg bg-[var(--green)] py-2.5 text-sm font-bold text-white hover:bg-[var(--green-hover)] disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存修改"}
          </button>
        </div>
      </aside>
    </>
  );
}
