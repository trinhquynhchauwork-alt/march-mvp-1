import type { FitBreakdown, FitDetail, MatchLevel, Profile, Program } from "@/types/domain";
import { scoreAcademic, minGpaForScore } from "@/lib/rules/gpa";
import {
  scoreEnglish,
  scoreGerman,
  ieltsScoreForValue,
  cefrScoreForLevel,
  minIeltsForScore,
  minCefrForScore,
  cefrStepGap,
  cefrFromCertificate,
  toeflToIeltsEquivalent,
} from "@/lib/rules/language";
import { CRITERION_LABELS } from "@/lib/config/criterionLabels";

// Match Score (mục 6.6, viết lại hoàn toàn ở v4) — Fit Ratio so với ngưỡng riêng từng
// chương trình, KHÔNG dùng điểm tuyệt đối như v2/v3 (mục 6.6.1). Major Fit vẫn là điểm
// tuyệt đối AI (không có ngưỡng để so sánh — mục 3.3/6.6.3), tái sử dụng từ Insight, không
// tính lại ở đây (P3 "không tính lại điểm hồ sơ", mục 1.5).

// Baseline dùng khi Program.requirement cho tiêu chí đó là null (không công bố ngưỡng) —
// tương đương "Good" trên thang chấm (mục 6.6.3), tránh match tuyệt đối 100% hoặc bị loại.
const BASELINE_SCORE = 70;
const FIT_RATIO_CAP = 1.2;

// Weight (mục 6.6.4) — không đổi so với v3 (đã normalize sau khi loại Financial).
const MATCH_WEIGHTS: Record<Profile["targetDegree"], { academic: number; language: number; majorFit: number }> = {
  Bachelor: { academic: 0.5, language: 0.375, majorFit: 0.125 },
  Master: { academic: 0.412, language: 0.294, majorFit: 0.294 },
};

function clampFitRatio(ratio: number): number {
  return Math.max(0, Math.min(FIT_RATIO_CAP, ratio));
}

function matchLevelFromScore(score: number): MatchLevel {
  if (score >= 85) return "Excellent Match";
  if (score >= 70) return "Good Match";
  if (score >= 55) return "Moderate Match";
  return "Low Match";
}

const MATCH_LEVEL_SENTENCE: Record<MatchLevel, string> = {
  "Excellent Match": "Hồ sơ của bạn vượt trội so với yêu cầu đầu vào của chương trình này.",
  "Good Match": "Hồ sơ của bạn đáp ứng tốt yêu cầu đầu vào, còn một vài điểm có thể cải thiện thêm.",
  "Moderate Match": "Hồ sơ của bạn đáp ứng một phần yêu cầu đầu vào; nên cân nhắc cải thiện trước khi apply.",
  "Low Match": "Hồ sơ của bạn hiện chưa đáp ứng tốt yêu cầu đầu vào của chương trình này.",
};

// Verdict Line (mục 6.7.1, v4.1) — 1 dòng ngắn ngay dưới Match Score.
const VERDICT_LINE: Record<MatchLevel, string> = {
  "Excellent Match": "Rất khả thi — vượt yêu cầu",
  "Good Match": "Khả thi — cần cải thiện thêm",
  "Moderate Match": "Cần cải thiện đáng kể",
  "Low Match": "Chưa đáp ứng yêu cầu",
};

function languageProfileScoreForProgram(profile: Profile, teachingLanguage: Program["teachingLanguage"]): number | null {
  const en = scoreEnglish(profile.english);
  const de = scoreGerman(profile.german);
  if (teachingLanguage === "German") return de;
  if (teachingLanguage === "English") return en;
  // "English & German" — permissive, dùng điểm cao nhất (mục 6.3: chỉ ảnh hưởng thứ tự
  // Language Score dùng để tính Match Score, không loại trừ chương trình).
  return en != null || de != null ? Math.max(en ?? 0, de ?? 0) : null;
}

function academicRequiredScoreEquivalent(program: Program): { score: number; usedBaseline: boolean } {
  const minGpa4 = program.requirement.minGpa4;
  if (minGpa4 == null) return { score: BASELINE_SCORE, usedBaseline: true };
  return { score: scoreAcademic(minGpa4), usedBaseline: false };
}

function languageRequiredScoreEquivalent(
  program: Program
): { score: number; usedBaseline: boolean } {
  const minLanguage = program.requirement.minLanguage;
  if (!minLanguage) return { score: BASELINE_SCORE, usedBaseline: true };

  if (program.teachingLanguage === "German") {
    if (minLanguage.german) return { score: cefrScoreForLevel(minLanguage.german.minCEFR), usedBaseline: false };
    return { score: BASELINE_SCORE, usedBaseline: true };
  }
  if (program.teachingLanguage === "English") {
    if (minLanguage.english) return { score: ieltsScoreForValue(minLanguage.english.minScore), usedBaseline: false };
    return { score: BASELINE_SCORE, usedBaseline: true };
  }
  // "English & German" — dùng ngưỡng permissive nhất đã công bố (thấp hơn dễ đạt hơn); nếu
  // chỉ công bố 1 trong 2, dùng cái đã có; nếu không công bố gì, baseline.
  const candidates: number[] = [];
  if (minLanguage.english) candidates.push(ieltsScoreForValue(minLanguage.english.minScore));
  if (minLanguage.german) candidates.push(cefrScoreForLevel(minLanguage.german.minCEFR));
  if (candidates.length === 0) return { score: BASELINE_SCORE, usedBaseline: true };
  return { score: Math.min(...candidates), usedBaseline: false };
}

export interface MatchScoreResult {
  matchScore: number;
  matchLevel: MatchLevel;
  matchLevelExplanation: string;
  verdictLine: string;
  fitBreakdown: FitBreakdown;
}

export function computeMatchScore(
  profile: Profile,
  program: Program,
  majorFitScore: number | null
): MatchScoreResult {
  const weights = MATCH_WEIGHTS[profile.targetDegree];

  // Academic Fit — luôn evaluated (GPA là field bắt buộc ở P1).
  const academicProfileScore = scoreAcademic(profile.gpa.normalized);
  const academicRequired = academicRequiredScoreEquivalent(program);
  const academicFitRatio = clampFitRatio(academicProfileScore / academicRequired.score);
  const academic: FitDetail = {
    profileScore: academicProfileScore,
    requiredScoreEquivalent: academicRequired.score,
    fitRatio: academicFitRatio,
    status: "evaluated",
  };

  // Language Fit — not_evaluated nếu hồ sơ thiếu chứng chỉ phù hợp ngôn ngữ giảng dạy
  // (mục 6.6.8: thiếu dữ liệu HỒ SƠ, khác với Program.requirement=null dùng baseline).
  const languageProfileScore = languageProfileScoreForProgram(profile, program.teachingLanguage);
  const languageRequired = languageRequiredScoreEquivalent(program);
  const language: FitDetail =
    languageProfileScore == null
      ? { profileScore: null, requiredScoreEquivalent: languageRequired.score, fitRatio: null, status: "not_evaluated" }
      : {
          profileScore: languageProfileScore,
          requiredScoreEquivalent: languageRequired.score,
          fitRatio: clampFitRatio(languageProfileScore / languageRequired.score),
          status: "evaluated",
        };

  const majorFit = { score: majorFitScore ?? 0 };

  const parts: { id: "academic" | "language" | "major_fit"; score: number; weight: number }[] = [
    { id: "academic", score: academicFitRatio * 100, weight: weights.academic },
  ];
  if (language.status === "evaluated" && language.fitRatio != null) {
    parts.push({ id: "language", score: language.fitRatio * 100, weight: weights.language });
  }
  if (majorFitScore != null) {
    parts.push({ id: "major_fit", score: majorFitScore, weight: weights.majorFit });
  }

  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  const rawScore =
    totalWeight === 0 ? 0 : parts.reduce((sum, p) => sum + Math.min(100, p.score) * p.weight, 0) / totalWeight;
  const matchScore = Math.round(Math.min(100, rawScore));

  const matchLevel = matchLevelFromScore(matchScore);
  const verdictLine = VERDICT_LINE[matchLevel];

  // Match Level Explanation (mục 6.6.9) — template rule-based, liệt kê đúng tiêu chí +
  // trọng số ĐÃ ÁP DỤNG (đã normalize nếu Language bị loại).
  const criteriaText = parts
    .map((p) => `${CRITERION_LABELS[p.id]} (${((p.weight / totalWeight) * 100).toFixed(1)}%)`)
    .join(" + ");
  const usedBaseline = academicRequired.usedBaseline || (language.status === "evaluated" && languageRequired.usedBaseline);
  const baselineNote = usedBaseline
    ? " Chương trình này không công bố ngưỡng GPA/ngôn ngữ cụ thể — mức so sánh dùng ngưỡng tham khảo trung bình."
    : "";
  const matchLevelExplanation = `Match Score được tính từ: ${criteriaText}, dựa trên mức độ hồ sơ hiện tại của bạn đáp ứng yêu cầu riêng của chương trình này.\n\n${MATCH_LEVEL_SENTENCE[matchLevel]}${baselineNote}`;

  return {
    matchScore,
    matchLevel,
    matchLevelExplanation,
    verdictLine,
    fitBreakdown: { academic, language, majorFit },
  };
}

// Match Summary bullets (mục 6.7, 6.7.1 v4.1) — template rule-based, nêu cụ thể "còn thiếu
// bao nhiêu" quy đổi ngược về đơn vị gốc (điểm IELTS, bậc CEFR, điểm GPA), không chỉ nói
// chung chung. KHÔNG dùng AI.
export function buildMatchSummary(profile: Profile, program: Program, majorFitScore: number | null): string[] {
  const summary: string[] = [];

  // --- GPA bullet ---
  const targetGpa = program.requirement.minGpa4 ?? minGpaForScore(BASELINE_SCORE);
  if (profile.gpa.normalized >= targetGpa) {
    summary.push(
      `✓ GPA của bạn (${profile.gpa.normalized.toFixed(2)}/4.0) đáp ứng ngưỡng tham khảo của chương trình (${targetGpa.toFixed(2)}/4.0).`
    );
  } else {
    const gap = targetGpa - profile.gpa.normalized;
    summary.push(
      `! GPA của bạn (${profile.gpa.normalized.toFixed(2)}/4.0) chưa đạt ngưỡng — cần thêm ~${gap.toFixed(2)} điểm GPA (thang 4.0) để đạt ngưỡng ${targetGpa.toFixed(2)}.`
    );
  }

  // --- Language bullet ---
  const teachingLanguage = program.teachingLanguage;
  const usesGerman = teachingLanguage === "German" || (teachingLanguage === "English & German" && scoreGerman(profile.german) != null && (scoreEnglish(profile.english) ?? -1) < (scoreGerman(profile.german) ?? -1));
  const usesEnglish = !usesGerman;

  if (usesEnglish) {
    if (profile.english?.score == null) {
      summary.push("! Chưa có chứng chỉ ngôn ngữ (IELTS/TOEFL) phù hợp với ngôn ngữ giảng dạy của chương trình.");
    } else {
      const targetIelts = program.requirement.minLanguage?.english?.minScore ?? minIeltsForScore(BASELINE_SCORE);
      const currentIelts =
        profile.english.type === "TOEFL" ? toeflToIeltsEquivalent(profile.english.score) : profile.english.score;
      if (ieltsScoreForValue(currentIelts) >= ieltsScoreForValue(targetIelts)) {
        summary.push(`✓ Trình độ tiếng Anh của bạn đáp ứng ngưỡng tham khảo (IELTS ${targetIelts.toFixed(1)}).`);
      } else {
        const gap = Math.max(0, targetIelts - currentIelts);
        summary.push(
          `! Trình độ tiếng Anh của bạn chưa đạt ngưỡng — cần thêm ~${gap.toFixed(1)} điểm IELTS để đạt ngưỡng ${targetIelts.toFixed(1)}.`
        );
      }
    }
  } else {
    const currentCefr = cefrFromCertificate(profile.german);
    if (!currentCefr) {
      summary.push("! Chưa có chứng chỉ tiếng Đức phù hợp với ngôn ngữ giảng dạy của chương trình.");
    } else {
      const targetCefr = program.requirement.minLanguage?.german?.minCEFR ?? minCefrForScore(BASELINE_SCORE);
      const steps = cefrStepGap(currentCefr, targetCefr);
      if (steps <= 0) {
        summary.push(`✓ Trình độ tiếng Đức của bạn (${currentCefr}) đáp ứng ngưỡng tham khảo (${targetCefr}).`);
      } else {
        summary.push(
          `! Trình độ tiếng Đức của bạn (${currentCefr}) chưa đạt ngưỡng — cần thêm ~${steps} bậc CEFR để đạt ngưỡng ${targetCefr}.`
        );
      }
    }
  }

  // --- Major Fit bullet ---
  if (majorFitScore == null) {
    summary.push("! Chưa đủ dữ liệu để đánh giá mức độ phù hợp ngành.");
  } else if (majorFitScore >= 70) {
    summary.push("✓ Chuyên ngành hiện tại phù hợp với chương trình đăng ký (theo đánh giá AI).");
  } else {
    summary.push("! Chuyên ngành hiện tại chỉ phù hợp một phần với chương trình đăng ký (theo đánh giá AI).");
  }

  return summary;
}
