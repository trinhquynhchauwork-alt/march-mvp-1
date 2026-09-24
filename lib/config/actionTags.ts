import type { CriterionId } from "@/types/domain";
import { CRITERION_LABELS } from "@/lib/config/criterionLabels";

// Tag nhỏ cho mỗi Next Action, để user liên hệ ngược lại khối "Ưu tiên cải thiện" (mục
// 5.15.2). AI Prompt 2 (mục 9) chỉ trả next_actions dạng string[], không có field tag —
// suy luận bằng keyword matching rule-based (không phải AI, không phải business score) trên
// nội dung action, chỉ mang tính gợi ý điều hướng UI.
const KEYWORD_MAP: { pattern: RegExp; id: CriterionId }[] = [
  { pattern: /ielts|toefl|goethe|testdaf|dsh|telc|ngôn ngữ|tiếng anh|tiếng đức/i, id: "language" },
  { pattern: /gre|gmat|gate|cfa|chứng chỉ học thuật/i, id: "certificate" },
  { pattern: /gpa|điểm học|học lực|học thuật/i, id: "academic" },
  { pattern: /nghiên cứu|research|publication|hội nghị|conference/i, id: "research" },
  { pattern: /lãnh đạo|leadership|ngoại khóa|câu lạc bộ|club/i, id: "leadership" },
  { pattern: /kinh nghiệm|thực tập|internship|dự án|project/i, id: "experience" },
  { pattern: /ngành|major|chuyên ngành/i, id: "major_fit" },
];

export function inferActionCriterionId(actionText: string): CriterionId | null {
  return KEYWORD_MAP.find((k) => k.pattern.test(actionText))?.id ?? null;
}

export function inferActionTag(actionText: string): string | null {
  const id = inferActionCriterionId(actionText);
  return id ? CRITERION_LABELS[id] : null;
}

export type PriorityLabel = "CẦN" | "NÊN CÓ" | "TÙY CHỌN";

// Rule-based priority mapping (mục 5.15.2, v4.1) — bám thứ hạng Impact Score (mục 5.14) của
// tiêu chí liên quan, KHÔNG để AI tự quyết định mức ưu tiên (AC-UX13). Dùng chung giữa
// NextActionsChecklist (UI) và lib/pdf/exportReport (PDF) — một nguồn logic duy nhất.
export function priorityLabelFor(actionText: string, rankedIds: string[]): PriorityLabel {
  const id = inferActionCriterionId(actionText);
  if (!id) return "TÙY CHỌN";
  const rank = rankedIds.indexOf(id);
  if (rank === 0) return "CẦN";
  if (rank === 1) return "NÊN CÓ";
  return "TÙY CHỌN";
}

export const PRIORITY_STYLE: Record<PriorityLabel, { color: string; background: string }> = {
  CẦN: { color: "var(--momo-brand-primary)", background: "var(--momo-brand-primary-tonal)" },
  "NÊN CÓ": { color: "var(--momo-brand-primary-dark)", background: "var(--momo-bg-surface)" },
  "TÙY CHỌN": { color: "var(--momo-text-secondary)", background: "var(--momo-bg-surface)" },
};
