"use client";

import type { Criterion } from "@/types/domain";
import { CRITERION_LABELS } from "@/lib/config/criterionLabels";
import { impactBarOpacity } from "@/lib/config/statusColors";

const TOOLTIP_TEXT =
  "Đây là 3 tiêu chí có trọng số chính thức trong Overall Score. Xếp hạng theo 'Impact Score' — tiêu chí xếp #1 là tiêu chí mà cải thiện sẽ tác động nhiều nhất lên điểm tổng.";

// Khối "Ưu tiên cải thiện" (mục 5.14). Thanh ngang Impact Score (mục 3.6.4, v4 — "Custom
// progress bar, brand.primary opacity giảm dần theo thứ hạng") được thêm lại có chủ đích ở
// v4: bar mã hoá IMPACT SCORE (mức độ ảnh hưởng nếu cải thiện) bằng độ dài + opacity theo
// rank, tách biệt rõ với con số Score (0-100) hiển thị riêng phía trên — khác bản v3 cũ đã
// bị bỏ vì bar/label lẫn lộn 2 đại lượng khác nhau (report bug từ user, screenshot trước đó).
export default function PriorityCriteriaList({ criteria }: { criteria: Criterion[] }) {
  const ruleCriteria = criteria.filter((c) => c.id === "academic" || c.id === "language" || c.id === "certificate");
  const evaluated = ruleCriteria
    .filter((c) => c.status === "evaluated" && c.impactScore != null)
    .sort((a, b) => (b.impactScore as number) - (a.impactScore as number));
  const notEvaluated = ruleCriteria.filter((c) => c.status === "not_evaluated");
  const maxImpact = Math.max(1, ...evaluated.map((c) => c.impactScore ?? 0));

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}>
      <div className="flex items-center gap-1.5">
        <h2 className="text-header-m-bold" style={{ color: "var(--momo-text-default)" }}>
          Ưu tiên cải thiện
        </h2>
        <span className="group relative inline-flex cursor-help" tabIndex={0}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="var(--momo-brand-primary)" strokeWidth="1.4" />
            <path d="M7 6.2v4M7 4.1h.01" stroke="var(--momo-brand-primary)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span
            className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg p-2.5 text-description-default-regular opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100"
            style={{ background: "var(--momo-text-default)", color: "#ffffff" }}
          >
            {TOOLTIP_TEXT}
          </span>
        </span>
      </div>
      <p className="mt-0.5 text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
        3 tiêu chí quyết định trực tiếp Overall Score, xếp theo mức độ ảnh hưởng nếu cải thiện.
      </p>
      <div className="mt-3 space-y-3">
        {evaluated.map((c, i) => (
          <div key={c.id} className={i > 0 ? "pt-3" : ""} style={i > 0 ? { borderTop: "1px solid var(--momo-border-default)" } : undefined}>
            <div className="flex items-center justify-between text-body-default-regular">
              <span className="flex items-center gap-2" style={{ color: "var(--momo-text-default)", fontWeight: 500 }}>
                <span
                  className="rounded-full px-2 py-0.5 text-action-xxs-bold"
                  style={{ background: "var(--momo-text-default)", color: "#ffffff" }}
                >
                  Ưu tiên #{i + 1}
                </span>
                {CRITERION_LABELS[c.id]}
              </span>
              <span style={{ color: "var(--momo-text-secondary)" }}>{c.score}/100</span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--momo-bg-surface)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${((c.impactScore ?? 0) / maxImpact) * 100}%`,
                  background: "var(--momo-brand-primary)",
                  opacity: impactBarOpacity(i + 1),
                }}
              />
            </div>
            {c.comment && (
              <p className="mt-1 text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
                {c.comment}
              </p>
            )}
          </div>
        ))}
        {notEvaluated.map((c) => (
          <p key={c.id} className="text-description-default-regular" style={{ color: "var(--momo-text-hint)" }}>
            Bổ sung {CRITERION_LABELS[c.id]} để được đánh giá đầy đủ hơn.
          </p>
        ))}
      </div>
    </div>
  );
}
