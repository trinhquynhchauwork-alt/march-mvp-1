import type { Criterion } from "@/types/domain";
import { CRITERION_LABELS } from "@/lib/config/criterionLabels";
import ProgressBar from "@/components/ProgressBar";

export default function CriterionCard({ criterion }: { criterion: Criterion }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{CRITERION_LABELS[criterion.id]}</h3>
        {criterion.status === "evaluated" && criterion.score != null ? (
          <span className="text-lg font-semibold text-gray-900">{criterion.score}</span>
        ) : (
          <span className="text-xs font-medium text-gray-400">Chưa đánh giá</span>
        )}
      </div>

      <div className="mt-2">
        {criterion.status === "evaluated" && criterion.score != null ? (
          <ProgressBar score={criterion.score} />
        ) : (
          <div className="h-1.5 w-full rounded-full bg-gray-100" />
        )}
      </div>

      {criterion.status === "evaluated" && criterion.comment && (
        <p className="mt-2 text-sm text-gray-600">{criterion.comment}</p>
      )}
      {criterion.status === "not_evaluated" && (
        <p className="mt-2 text-sm text-gray-400">Chưa đủ dữ liệu để đánh giá tiêu chí này.</p>
      )}
    </div>
  );
}
