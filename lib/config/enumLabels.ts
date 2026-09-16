import type { Classification, MatchLevel } from "@/types/domain";

// Enum nội bộ giữ nguyên tiếng Anh trong code/API (contract kỹ thuật) — chỉ bản dịch hiển
// thị ra UI mới cần tiếng Việt (mục 3.6.7, v4.1, AC-DS4).
export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  Excellent: "Xuất sắc",
  Good: "Tốt",
  Average: "Trung bình",
  "Need Improvement": "Cần cải thiện",
};

export const MATCH_LEVEL_LABELS: Record<MatchLevel, string> = {
  "Excellent Match": "Rất phù hợp",
  "Good Match": "Phù hợp tốt",
  "Moderate Match": "Phù hợp một phần",
  "Low Match": "Chưa phù hợp",
};

// Ranking Tier badge (mục 6.7.2, v4.1) — "unknown" không hiển thị (AC-UX15).
export const RANKING_TIER_LABELS: Record<1 | 2 | 3, string> = {
  1: "Tier 1 · Top nghiên cứu",
  2: "Tier 2 · Nghiên cứu mạnh",
  3: "Tier 3 · Đại học vùng",
};
