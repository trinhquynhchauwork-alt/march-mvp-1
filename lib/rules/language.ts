import type { Certificate } from "@/types/domain";

export type RuleScoreResult = { status: "evaluated"; score: number } | { status: "not_evaluated" };

// TOEFL iBT -> IELTS band tương đương (bảng quy đổi công khai ETS/British Council).
// Cần thiết vì spec cũ (mục 4.2b) yêu cầu "TOEFL quy đổi tương đương IELTS" trước khi áp bảng điểm.
function toeflToIeltsEquivalent(toefl: number): number {
  if (toefl >= 118) return 9.0;
  if (toefl >= 115) return 8.5;
  if (toefl >= 110) return 8.0;
  if (toefl >= 102) return 7.5;
  if (toefl >= 94) return 7.0;
  if (toefl >= 79) return 6.5;
  if (toefl >= 60) return 6.0;
  if (toefl >= 46) return 5.5;
  if (toefl >= 35) return 5.0;
  return 4.0;
}

function scoreEnglish(cert?: Certificate): number | null {
  if (!cert || cert.score == null) return null;
  const ielts = cert.type === "TOEFL" ? toeflToIeltsEquivalent(cert.score) : cert.score;
  if (ielts >= 7.0) return 90;
  if (ielts >= 6.5) return 80;
  if (ielts >= 6.0) return 65;
  return 45;
}

function scoreGerman(cert?: Certificate): number | null {
  if (!cert || !cert.level) return null;
  switch (cert.level) {
    case "C2":
      return 90;
    case "C1":
      return 85;
    case "B2":
      return 65;
    default: // A1, A2, B1
      return 45;
  }
}

// Language — max(English, German). Nếu cả hai đều trống -> not_evaluated (spec mục 5.4).
export function scoreLanguage(english?: Certificate, german?: Certificate): RuleScoreResult {
  const en = scoreEnglish(english);
  const de = scoreGerman(german);
  if (en == null && de == null) return { status: "not_evaluated" };
  return { status: "evaluated", score: Math.max(en ?? 0, de ?? 0) };
}
