"use client";

import { platformLabel, type Topic } from "./Board";

export function TopicCard({ topic, onClick }: { topic: Topic; onClick: () => void }) {
  const scoreColor = topic.total >= 9 ? "bg-green-100 text-green-700" : topic.total >= 6 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500";

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3 text-left shadow-sm transition hover:shadow-md"
    >
      {/* Title */}
      <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-snug">{topic.title}</h3>

      {/* Tags row */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {topic.platform && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
            {platformLabel(topic.platform)}
          </span>
        )}
        {topic.contentType && (
          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-600">
            {topic.contentType}
          </span>
        )}
        {topic.series && (
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">
            {topic.series}
            {topic.seriesOrder ? ` #${topic.seriesOrder}` : ""}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {topic.scheduledDate && (
            <span className="text-[10px] font-medium text-[var(--muted)]">📅 {topic.scheduledDate}</span>
          )}
          {topic.hkr && (
            <span className="text-[10px] font-medium text-[var(--faint)]">{topic.hkr}</span>
          )}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreColor}`}>
          {topic.total}分
        </span>
      </div>
    </button>
  );
}
