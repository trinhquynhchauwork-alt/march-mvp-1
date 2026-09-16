import type { CriterionId, TargetDegree } from "@/types/domain";

// Trọng số theo bậc học — giữ nguyên tỷ lệ gốc 8 tiêu chí (spec v1), bỏ hẳn `financial`.
// computeOverallScore() chia cho tổng trọng số của các tiêu chí THỰC SỰ evaluated, nên
// việc thiếu key "financial" ở đây tự động khiến phần trọng số của nó được phân bổ lại
// theo tỷ lệ cho 7 tiêu chí còn lại — đúng cơ chế renormalize đã có sẵn (spec v2 mục 0,
// "áp dụng vĩnh viễn cho Financial thay vì theo từng session").
const WEIGHTS: Record<TargetDegree, Record<CriterionId, number>> = {
  Bachelor: {
    academic: 0.22,
    language: 0.18,
    major_fit: 0.15,
    experience: 0.08,
    research: 0.05,
    leadership: 0.12,
    certificate: 0.05,
  },
  Master: {
    academic: 0.18,
    language: 0.15,
    major_fit: 0.18,
    experience: 0.15,
    research: 0.12,
    leadership: 0.05,
    certificate: 0.05,
  },
};

export function getWeights(targetDegree: TargetDegree): Record<CriterionId, number> {
  return WEIGHTS[targetDegree];
}

// Trọng số riêng cho Impact Score (spec v3 mục 5.14.2) — CHỈ 3 tiêu chí rule-based,
// renormalize về 100% NGAY GIỮA 3 tiêu chí này (không tính chung với 4 tiêu chí AI), khớp
// đúng ví dụ trong spec (Master: Academic 41.2 + Language 29.4 + Certificate 29.4 = 100).
// Số ở dạng PHẦN TRĂM (41.2, không phải 0.412) vì công thức Impact Score dùng trực tiếp
// weight percent × (100 − score) — xem ví dụ mục 5.14.2.
const IMPACT_WEIGHTS_PERCENT: Record<TargetDegree, { academic: number; language: number; certificate: number }> = {
  Bachelor: { academic: 50, language: 37.5, certificate: 12.5 },
  Master: { academic: 41.2, language: 29.4, certificate: 29.4 },
};

export function getImpactWeightsPercent(
  targetDegree: TargetDegree
): { academic: number; language: number; certificate: number } {
  return IMPACT_WEIGHTS_PERCENT[targetDegree];
}
