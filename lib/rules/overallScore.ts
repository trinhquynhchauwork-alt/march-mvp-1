import type { Classification, Criterion, TargetDegree } from "@/types/domain";
import { getWeights } from "@/lib/rules/weights";

export function classify(score: number): Classification {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Average";
  return "Need Improvement";
}

// Overall Score = weighted average trên các tiêu chí `evaluated`.
// Tiêu chí `not_evaluated` bị loại khỏi phép tính, trọng số còn lại normalize
// theo tỷ lệ để tổng vẫn = 100% (spec mục 5.7).
export function computeOverallScore(
  criteria: Criterion[],
  targetDegree: TargetDegree
): { overallScore: number; classification: Classification; evaluatedCount: number } {
  const weights = getWeights(targetDegree);
  const evaluated = criteria.filter((c) => c.status === "evaluated" && c.score != null);

  const totalWeight = evaluated.reduce((sum, c) => sum + weights[c.id], 0);

  const overallScore =
    totalWeight === 0
      ? 0
      : Math.round(
          evaluated.reduce((sum, c) => sum + (c.score as number) * weights[c.id], 0) / totalWeight
        );

  return {
    overallScore,
    classification: classify(overallScore),
    evaluatedCount: evaluated.length,
  };
}
