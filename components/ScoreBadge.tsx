import type { ReactNode } from "react";
import { STATUS_TOKENS, type StatusIcon } from "@/lib/config/statusColors";
import { CLASSIFICATION_LABELS, MATCH_LEVEL_LABELS } from "@/lib/config/enumLabels";
import type { Classification, MatchLevel } from "@/types/domain";

// MoMo `Tag` component (mục 3.6.4) — hiển thị Classification/Match Level. LUÔN kèm icon
// (mục 3.5/AC-DS3), không dùng màu đơn độc để phân biệt trạng thái. Không phải phần tử
// clickable — dùng màu Status, không dùng màu Accent (mục 3.5).
const ICONS: Record<StatusIcon, ReactNode> = {
  check: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.2 5 8.7l4.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  info: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 5.4v3M6 3.6h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1.5 11 10H1L6 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 4.8v2.6M6 8.9h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

function displayLabel(label: string): string {
  return (
    CLASSIFICATION_LABELS[label as Classification] ?? MATCH_LEVEL_LABELS[label as MatchLevel] ?? label
  );
}

export default function ScoreBadge({ label }: { label: string }) {
  const token = STATUS_TOKENS[label] ?? { color: "var(--momo-text-secondary)", container: "var(--momo-bg-surface)", icon: "info" as const };

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-s-medium"
      style={{ color: token.color, background: token.container }}
    >
      {ICONS[token.icon]}
      {displayLabel(label)}
    </span>
  );
}
