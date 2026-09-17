// MoMo Status Token mapping (mục 3.6.2) — Classification (P2) / Match Level (P3) → 1 trong
// 4 status token cố định (Success/Warning/Error/Interactive). LƯU Ý: đây KHÔNG phải thang
// "xanh lá tốt dần → đỏ xấu dần" — "Good"/"Moderate Match" gán vào Interactive (xanh dương),
// không phải một sắc xanh lá khác (mục 3.6.2). Icon đi kèm bắt buộc (mục 3.5/AC-DS3).
export type StatusIcon = "check" | "info" | "warning" | "error";

export interface StatusToken {
  color: string;
  container: string;
  icon: StatusIcon;
}

export const STATUS_TOKENS: Record<string, StatusToken> = {
  Excellent: { color: "var(--momo-success)", container: "var(--momo-success-container)", icon: "check" },
  Good: { color: "var(--momo-interactive)", container: "var(--momo-interactive-container)", icon: "info" },
  Average: { color: "var(--momo-warning)", container: "var(--momo-warning-container)", icon: "warning" },
  "Need Improvement": { color: "var(--momo-error)", container: "var(--momo-error-container)", icon: "error" },
  "Excellent Match": { color: "var(--momo-success)", container: "var(--momo-success-container)", icon: "check" },
  "Good Match": { color: "var(--momo-interactive)", container: "var(--momo-interactive-container)", icon: "info" },
  "Moderate Match": { color: "var(--momo-warning)", container: "var(--momo-warning-container)", icon: "warning" },
  "Low Match": { color: "var(--momo-error)", container: "var(--momo-error-container)", icon: "error" },
};
