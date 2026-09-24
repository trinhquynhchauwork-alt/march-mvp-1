"use client";

import type { Criterion } from "@/types/domain";
import { CRITERION_LABELS } from "@/lib/config/criterionLabels";

const TOOLTIP_TEXT =
  "Đây là 3 tiêu chí có trọng số chính thức trong Overall Score. Xếp hạng theo 'Impact Score' — tiêu chí xếp #1 là tiêu chí mà cải thiện sẽ tác động nhiều nhất lên điểm tổng, dù điểm hiện tại của nó có thể không phải điểm thấp nhất.";

// Khối "Ưu tiên cải thiện" (mục 5.14). Bỏ hẳn progress bar minh hoạ Impact Score và câu quy
// đổi "+X điểm" (report từ user 18/09 — cả 2 cách trình bày đều bị thấy khó hiểu) — chỉ còn
// thứ hạng + điểm hiện tại + nhận xét, đơn giản nhất có thể.
export default function PriorityCriteriaList({ criteria }: { criteria: Criterion[] }) {
  const ruleCriteria = criteria.filter((c) => c.id === "academic" || c.id === "language" || c.id === "certificate");
  const evaluated = ruleCriteria
    .filter((c) => c.status === "evaluated" && c.impactScore != null)
    .sort((a, b) => (b.impactScore as number) - (a.impactScore as number));
  const notEvaluated = ruleCriteria.filter((c) => c.status === "not_evaluated");

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
            className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-64 max-w-[80vw] rounded-lg p-2.5 text-description-default-regular opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100"
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
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-body-default-regular">
              <span className="flex items-center gap-2" style={{ color: "var(--momo-text-default)", fontWeight: 500 }}>
                <span
                  className="rounded-full px-2 py-0.5 text-action-xxs-bold"
                  style={{ background: "var(--momo-text-default)", color: "#ffffff" }}
                >
                  Ưu tiên #{i + 1}
                </span>
                {CRITERION_LABELS[c.id]}
              </span>
              <span style={{ color: "var(--momo-text-secondary)" }}>{c.score}/100 điểm hiện tại</span>
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
