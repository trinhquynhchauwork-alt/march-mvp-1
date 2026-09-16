import type { Certificate, Cefr } from "@/types/domain";

export type RuleScoreResult = { status: "evaluated"; score: number } | { status: "not_evaluated" };

// TOEFL iBT -> IELTS band tương đương (bảng quy đổi công khai ETS/British Council).
// Spec liệt kê TOEFL là loại được hỗ trợ (mục 4.5) nhưng chỉ cho bảng điểm IELTS
// (mục 5.4.2) — quy đổi trước rồi áp bảng IELTS.
export function toeflToIeltsEquivalent(toefl: number): number {
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

// English — bảng IELTS (mục 5.4.2).
const IELTS_BANDS = [
  { min: 8.0, score: 100 },
  { min: 7.5, score: 95 },
  { min: 7.0, score: 90 },
  { min: 6.5, score: 80 },
  { min: 6.0, score: 70 },
  { min: 5.5, score: 60 },
  { min: 0, score: 40 },
] as const;

export function ieltsScoreForValue(ielts: number): number {
  return IELTS_BANDS.find((b) => ielts >= b.min)?.score ?? 40;
}

export function scoreEnglish(cert?: Certificate): number | null {
  if (!cert || cert.score == null) return null;
  const ielts = cert.type === "TOEFL" ? toeflToIeltsEquivalent(cert.score) : cert.score;
  return ieltsScoreForValue(ielts);
}

// Quy đổi thang gốc của từng loại chứng chỉ Đức sang CEFR — bảng đầy đủ (mục 5.4.2, v4).
// KHÁC v3: TestDaF/DSH đã được sửa lại (thấp hơn 1 bậc CEFR so với bảng v3 cũ, vd TDN 4
// giờ là B2 chứ không phải C1) — đây là correction có chủ đích của spec v4, không phải lỗi.
function toCefr(type: string, level: string): Cefr | null {
  const normalized = level.trim().toUpperCase();

  // Goethe-Zertifikat, telc Deutsch, ÖSD — map trực tiếp theo tên mức (1-1).
  if (type === "Goethe" || type === "telc" || type === "ÖSD") {
    return (["A1", "A2", "B1", "B2", "C1", "C2"] as const).find((c) => c === normalized) ?? null;
  }

  const digitMatch = normalized.match(/(\d)/);
  const digit = digitMatch ? digitMatch[1] : null;

  // TestDaF: chỉ nhận mức đồng đều trên cả 4 kỹ năng (form hiện tại chỉ thu 1 mức tổng,
  // không tách theo kỹ năng — nếu CV/form có mức không đồng đều, quy tắc "lấy thấp nhất"
  // (mục 5.4.2) không áp dụng được vì không có dữ liệu tách kỹ năng; giữ nguyên digit-map).
  if (type === "TestDaF") {
    if (digit === "3") return "B1";
    if (digit === "4") return "B2";
    if (digit === "5") return "C1";
    return null;
  }

  if (type === "DSH") {
    if (digit === "1") return "B1";
    if (digit === "2") return "C1";
    if (digit === "3") return "C2";
    return null;
  }

  return null;
}

const CEFR_BANDS: { level: Cefr; score: number }[] = [
  { level: "C2", score: 100 },
  { level: "C1", score: 90 },
  { level: "B2", score: 80 },
  { level: "B1", score: 60 },
  { level: "A2", score: 40 },
  { level: "A1", score: 20 },
];

const CEFR_SCORE: Record<Cefr, number> = { C2: 100, C1: 90, B2: 80, B1: 60, A2: 40, A1: 20 };
const CEFR_ORDER: Cefr[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function cefrScoreForLevel(cefr: Cefr): number {
  return CEFR_SCORE[cefr];
}

export function scoreGerman(cert?: Certificate): number | null {
  if (!cert || !cert.type || !cert.level) return null;
  const cefr = toCefr(cert.type, cert.level);
  return cefr ? cefrScoreForLevel(cefr) : null;
}

// Language — max(English, German). Nếu cả hai đều trống -> not_evaluated (mục 5.4.2).
export function scoreLanguage(english?: Certificate, german?: Certificate): RuleScoreResult {
  const en = scoreEnglish(english);
  const de = scoreGerman(german);
  if (en == null && de == null) return { status: "not_evaluated" };
  return { status: "evaluated", score: Math.max(en ?? 0, de ?? 0) };
}

// --- Reverse lookup (mục 6.7.1, v4.1) — nghịch đảo bảng điểm, dùng để hiển thị gap bullet
// bằng đơn vị gốc khi Program.requirement dùng baseline (không công bố ngưỡng cụ thể,
// mục 6.6.3) — trường hợp DUY NHẤT không có sẵn ngưỡng ở đơn vị gốc để trừ trực tiếp.
// Quy tắc: lấy mức band gần nhất PHÍA TRÊN target score làm mốc "cần đạt tới" (không nội suy).
export function minIeltsForScore(targetScore: number): number {
  const ascending = [...IELTS_BANDS].sort((a, b) => a.min - b.min);
  return ascending.find((b) => b.score >= targetScore)?.min ?? ascending[ascending.length - 1].min;
}

export function minCefrForScore(targetScore: number): Cefr {
  const ascending = [...CEFR_BANDS].sort((a, b) => a.score - b.score);
  return ascending.find((b) => b.score >= targetScore)?.level ?? "C2";
}

// Khoảng cách giữa 2 bậc CEFR (vd B1 -> B2 = 1 bậc), dùng cho gap bullet "cần thêm N bậc CEFR".
export function cefrStepGap(current: Cefr, target: Cefr): number {
  return Math.max(0, CEFR_ORDER.indexOf(target) - CEFR_ORDER.indexOf(current));
}

export function cefrFromCertificate(cert?: Certificate): Cefr | null {
  if (!cert || !cert.type || !cert.level) return null;
  return toCefr(cert.type, cert.level);
}
