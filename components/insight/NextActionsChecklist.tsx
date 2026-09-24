"use client";

import { useState } from "react";
import type { Criterion } from "@/types/domain";
import { inferActionTag, priorityLabelFor, PRIORITY_STYLE } from "@/lib/config/actionTags";

// Next Actions dạng checklist (mục 5.15). Tick chỉ lưu tạm trên client (mục 5.15.2/1.3) —
// không có tài khoản/lưu tiến độ lâu dài ở MVP. Xuất file giờ nằm ở P3 (mục bug 24/09 —
// gộp chung với danh sách trường thành 1 file duy nhất), component này chỉ còn hiển thị.
export default function NextActionsChecklist({
  nextActions,
  priorityCriteria,
}: {
  nextActions: string[];
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

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}>
      <h2 className="text-header-m-bold" style={{ color: "var(--momo-text-default)" }}>
        Việc cần làm tiếp theo
      </h2>

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
