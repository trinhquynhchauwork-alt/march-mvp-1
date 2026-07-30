import type { MatchLevel, Profile } from "@/types/domain";
import { scoreAcademic } from "@/lib/rules/gpa";
import { scoreLanguage } from "@/lib/rules/language";
import { scoreFinancial } from "@/lib/rules/financial";
import { GERMANY_VISA_PROOF_EUR } from "@/lib/config/constants";

// School Matching (mục 6.6) chỉ nhận Profile làm input (API contract mục 8) — không có
// GPA tối thiểu / học phí / yêu cầu ngôn ngữ riêng của từng trường (Prompt 3 + MatchedSchool
// interface mục 7.4/9 không có các field đó, theo đúng chỉ định không tự thêm field).
// Vì vậy Academic/Language/Budget được tính lại bằng CHÍNH rule engine dùng ở Insight
// (single source of truth — mục 3.2), đóng vai trò "độ cạnh tranh tuyệt đối" của hồ sơ.
// Major Fit là tiêu chí duy nhất so khớp trực tiếp với chương trình tìm được, bằng keyword
// overlap thuần rule-based (không AI, đúng mục 6.6).

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFC")
    .split(/[^a-zà-ỹ0-9]+/i)
    .filter((w) => w.length > 2);
}

function scoreMajorFit(interestedMajors: string[], programName: string): number {
  const programWords = new Set(normalizeWords(programName));
  const programLower = programName.toLowerCase();

  const exact = interestedMajors.some((m) => programLower.includes(m.toLowerCase()));
  if (exact) return 100;

  const partial = interestedMajors.some((m) =>
    normalizeWords(m).some((w) => programWords.has(w))
  );
  if (partial) return 60;

  return 20;
}

function matchLevelFromScore(score: number): MatchLevel {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  return "Average";
}

export interface MatchScoreResult {
  matchScore: number;
  matchLevel: MatchLevel;
  summary: string[];
}

export function computeMatchScore(
  profile: Profile,
  candidate: { university: string; program: string }
): MatchScoreResult {
  const academic = scoreAcademic(profile.gpa.normalized);
  const languageResult = scoreLanguage(profile.english, profile.german);
  const language = languageResult.status === "evaluated" ? languageResult.score : 0;
  const financial = scoreFinancial(profile.annualBudget.eur);
  const majorFit = scoreMajorFit(profile.interestedMajors, candidate.program);

  const matchScore = Math.round((academic + language + financial + majorFit) / 4);
  const matchLevel = matchLevelFromScore(matchScore);

  const summary: string[] = [];

  summary.push(
    academic >= 75
      ? `✓ GPA (${profile.gpa.normalized.toFixed(2)}/4.0) thuộc nhóm cạnh tranh cho hồ sơ du học Đức.`
      : academic >= 60
        ? `⚠ GPA (${profile.gpa.normalized.toFixed(2)}/4.0) ở mức trung bình, nên cải thiện thêm.`
        : `✕ GPA (${profile.gpa.normalized.toFixed(2)}/4.0) khá thấp so với mặt bằng chung.`
  );

  if (languageResult.status === "not_evaluated") {
    summary.push("⚠ Chưa có chứng chỉ ngôn ngữ — bổ sung IELTS/TOEFL hoặc Đức ngữ để đánh giá đầy đủ.");
  } else {
    summary.push(
      language >= 80
        ? "✓ Chứng chỉ ngôn ngữ cao hơn mức phổ biến yêu cầu."
        : language >= 65
          ? "⚠ Chứng chỉ ngôn ngữ ở mức đủ điều kiện, một số chương trình có thể yêu cầu cao hơn."
          : "✕ Chứng chỉ ngôn ngữ hiện tại thấp hơn mức phổ biến yêu cầu."
    );
  }

  summary.push(
    financial >= 60
      ? `✓ Budget ${profile.annualBudget.eur.toLocaleString("de-DE")} EUR/năm đủ điều kiện chứng minh tài chính visa Đức (~${GERMANY_VISA_PROOF_EUR.toLocaleString("de-DE")} EUR).`
      : `⚠ Budget ${profile.annualBudget.eur.toLocaleString("de-DE")} EUR/năm hơi thấp so với mức chứng minh tài chính visa Đức (~${GERMANY_VISA_PROOF_EUR.toLocaleString("de-DE")} EUR).`
  );

  summary.push(
    majorFit >= 100
      ? "✓ Chương trình khớp với ngành bạn quan tâm."
      : majorFit >= 60
        ? "⚠ Chương trình liên quan gần với ngành bạn quan tâm — kiểm tra kỹ mô tả chương trình."
        : "✕ Chương trình có thể không khớp trực tiếp ngành bạn chọn — kiểm tra lại trên trang chính thức."
  );

  return { matchScore, matchLevel, summary };
}
