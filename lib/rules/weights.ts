import type { CriterionId, TargetDegree } from "@/types/domain";

// Trọng số theo bậc học (spec cũ mục 4.3, giữ nguyên).
const WEIGHTS: Record<TargetDegree, Record<CriterionId, number>> = {
  Bachelor: {
    academic: 0.22,
    language: 0.18,
    major_fit: 0.15,
    financial: 0.15,
    experience: 0.08,
    research: 0.05,
    leadership: 0.12,
    certificate: 0.05,
  },
  Master: {
    academic: 0.18,
    language: 0.15,
    major_fit: 0.18,
    financial: 0.12,
    experience: 0.15,
    research: 0.12,
    leadership: 0.05,
    certificate: 0.05,
  },
};

export function getWeights(targetDegree: TargetDegree): Record<CriterionId, number> {
  return WEIGHTS[targetDegree];
}
