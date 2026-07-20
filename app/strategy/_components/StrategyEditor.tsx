"use client";

import { useState, useCallback } from "react";

export function StrategyEditor({
  version,
  note: initialNote,
  initialContent,
}: {
  version: number;
  note: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const showToast = useCallback((kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleContentChange = (val: string) => {
    setContent(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch {
      setJsonError("JSON 格式有误");
    }
  };

  const handleSave = async () => {
    if (jsonError) {
      showToast("err", "JSON 格式不正确，请检查后再试");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, note }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "保存失败");
      }
      const data = await res.json();
      showToast("ok", `已保存为新版本 v${data.version}`);
      setNote("");
    } catch (e) {
      showToast("err", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(content);
      setContent(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      showToast("err", "JSON 格式不正确，无法格式化");
    }
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-6 top-20 z-50 rounded-lg px-4 py-2 text-sm font-medium shadow-lg ${toast.kind === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Info bar */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs font-bold text-[var(--muted)]">当前版本</span>
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">v{version}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-[var(--muted)]">说明</span>
            <span className="ml-2 text-sm text-[var(--ink)]">{initialNote}</span>
          </div>
        </div>
        <button
          onClick={handleFormat}
          className="rounded-lg bg-[var(--canvas)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] hover:text-[var(--green)]"
        >
          格式化
        </button>
      </div>

      {/* Textarea */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)]">
        <textarea
          className="h-[calc(100vh-280px)] w-full rounded-lg bg-[var(--paper)] p-4 font-mono text-sm leading-relaxed text-[var(--ink)] outline-none"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      {/* Error hint */}
      {jsonError && (
        <div className="mt-2 text-xs font-bold text-red-500">⚠ {jsonError}</div>
      )}

      {/* Save bar */}
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
        <input
          className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
          placeholder="版本说明（如：调整关键词权重）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          disabled={saving || !!jsonError}
          onClick={handleSave}
          className="rounded-lg bg-[var(--green)] px-6 py-2 text-sm font-bold text-white hover:bg-[var(--green-hover)] disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存为新版本"}
        </button>
      </div>
    </div>
  );
}
