import type { Criterion } from "@/types/domain";
import { CRITERION_LABELS } from "@/lib/config/criterionLabels";
import ProgressBar from "@/components/ProgressBar";

export default function CriterionCard({ criterion }: { criterion: Criterion }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}>
      <div className="flex items-center justify-between">
        <h3 className="text-body-default-regular" style={{ color: "var(--momo-text-default)", fontWeight: 500 }}>
          {CRITERION_LABELS[criterion.id]}
        </h3>
        {criterion.status === "evaluated" && criterion.score != null ? (
          <span className="text-header-default-bold" style={{ color: "var(--momo-text-default)" }}>
            {criterion.score}
          </span>
        ) : (
          <span className="text-description-default-regular" style={{ color: "var(--momo-text-hint)" }}>
            Chưa đánh giá
          </span>
        )}
      </div>

      <div className="mt-2">
        {criterion.status === "evaluated" && criterion.score != null ? (
          <ProgressBar score={criterion.score} />
        ) : (
          <div className="h-1.5 w-full rounded-full" style={{ background: "var(--momo-bg-surface)" }} />
        )}
      </div>

      {criterion.status === "evaluated" && criterion.comment && (
        <p className="mt-2 text-body-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
          {criterion.comment}
        </p>
      )}
      {criterion.status === "not_evaluated" && (
        <p className="mt-2 text-body-default-regular" style={{ color: "var(--momo-text-hint)" }}>
          Chưa đủ dữ liệu để đánh giá tiêu chí này.
        </p>
      )}
    </div>
  );
}
