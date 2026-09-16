"use client";

import { useState } from "react";
import type { Criterion, Classification } from "@/types/domain";
import { CRITERION_LABELS } from "@/lib/config/criterionLabels";
import { inferActionCriterionId, inferActionTag } from "@/lib/config/actionTags";

type PriorityLabel = "CẦN" | "NÊN CÓ" | "TÙY CHỌN";

const PRIORITY_STYLE: Record<PriorityLabel, { color: string; background: string }> = {
  CẦN: { color: "var(--momo-brand-primary)", background: "var(--momo-brand-primary-tonal)" },
  "NÊN CÓ": { color: "var(--momo-brand-primary-dark)", background: "var(--momo-bg-surface)" },
  "TÙY CHỌN": { color: "var(--momo-text-secondary)", background: "var(--momo-bg-surface)" },
};

// Rule-based priority mapping (mục 5.15.2, v4.1) — bám thứ hạng Impact Score (mục 5.14) của
// tiêu chí liên quan, KHÔNG để AI tự quyết định mức ưu tiên (AC-UX13).
function priorityLabelFor(actionText: string, rankedIds: string[]): PriorityLabel {
  const id = inferActionCriterionId(actionText);
  if (!id) return "TÙY CHỌN";
  const rank = rankedIds.indexOf(id);
  if (rank === 0) return "CẦN";
  if (rank === 1) return "NÊN CÓ";
  return "TÙY CHỌN";
}

// Next Actions dạng checklist + Xuất file (mục 5.15). Tick chỉ lưu tạm trên client (mục
// 5.15.2/1.3) — không có tài khoản/lưu tiến độ lâu dài ở MVP.
export default function NextActionsChecklist({
  nextActions,
  overallScore,
  classification,
  priorityCriteria,
}: {
  nextActions: string[];
  overallScore: number;
  classification: Classification;
  priorityCriteria: Criterion[];
}) {
  const [checked, setChecked] = useState<boolean[]>(() => nextActions.map(() => false));

  // Cùng thứ hạng Impact Score dùng ở khối "Ưu tiên cải thiện" (mục 5.14) — #1/#2 quyết định
  // CẦN/NÊN CÓ, phần còn lại (rank #3 trở đi, hoặc tiêu chí AI) luôn TÙY CHỌN.
  const rankedIds = priorityCriteria
    .filter((c) => (c.id === "academic" || c.id === "language" || c.id === "certificate") && c.status === "evaluated" && c.impactScore != null)
    .sort((a, b) => (b.impactScore as number) - (a.impactScore as number))
    .map((c) => c.id);

  function toggle(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  async function handleDownload() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(16);
    doc.text("March — AI Profile Insight", 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Overall Score: ${overallScore}/100 (${classification})`, 14, y);
    y += 10;

    doc.setFontSize(13);
    doc.text("Uu tien cai thien", 14, y);
    y += 7;
    doc.setFontSize(10);
    const ranked = priorityCriteria
      .filter((c) => c.status === "evaluated")
      .sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0));
    ranked.forEach((c, i) => {
      doc.text(`#${i + 1} ${CRITERION_LABELS[c.id]} - ${c.score}/100`, 18, y);
      y += 6;
    });
    y += 4;

    doc.setFontSize(13);
    doc.text("Next Actions", 14, y);
    y += 7;
    doc.setFontSize(10);
    nextActions.forEach((action, i) => {
      const box = checked[i] ? "[x]" : "[ ]";
      const priority = priorityLabelFor(action, rankedIds);
      const lines = doc.splitTextToSize(`${box} [${priority}] ${action}`, 180);
      doc.text(lines, 18, y);
      y += 6 * lines.length;
    });

    doc.save("march-insight-result.pdf");
  }

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}>
      <div className="flex items-center justify-between">
        <h2 className="text-header-m-bold" style={{ color: "var(--momo-text-default)" }}>
          Việc cần làm tiếp theo
        </h2>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg px-3 py-1.5 text-action-s-bold"
          style={{ border: "1px solid var(--momo-brand-primary-tonal)", color: "var(--momo-brand-primary)" }}
        >
          Tải xuống
        </button>
      </div>

      {nextActions.length === 0 ? (
        <p className="mt-2 text-body-default-regular" style={{ color: "var(--momo-text-hint)" }}>
          Chưa có đề xuất — AI hiện không khả dụng.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {nextActions.map((action, i) => {
            const tag = inferActionTag(action);
            const priority = priorityLabelFor(action, rankedIds);
            const style = PRIORITY_STYLE[priority];
            return (
              <li key={i} className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={checked[i] ?? false}
                  onChange={() => toggle(i)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ accentColor: "var(--momo-brand-primary)" }}
                />
                <span className="text-body-default-regular" style={{ color: checked[i] ? "var(--momo-text-disabled)" : "var(--momo-text-default)", textDecoration: checked[i] ? "line-through" : "none" }}>
                  <span
                    className="mr-2 inline-block rounded-full px-2 py-0.5 text-action-xxs-bold"
                    style={{ color: style.color, background: style.background }}
                  >
                    {priority}
                  </span>
                  {action}
                  {tag && (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-description-xs-regular"
                      style={{ background: "var(--momo-bg-surface)", color: "var(--momo-text-secondary)" }}
                    >
                      {tag}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
