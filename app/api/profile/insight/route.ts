import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/validation/schemas";
import { scoreAcademic } from "@/lib/rules/gpa";
import { scoreLanguage } from "@/lib/rules/language";
import { scoreFinancial } from "@/lib/rules/financial";
import { scoreCertificate } from "@/lib/rules/certificate";
import { academicComment, languageComment, financialComment, certificateComment } from "@/lib/rules/comments";
import { computeOverallScore } from "@/lib/rules/overallScore";
import { generateInsightWithAi } from "@/lib/ai/prompts/insight";
import type { Criterion, InsightResult } from "@/types/domain";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Profile không hợp lệ.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const profile = parsed.data;

  // --- 4 tiêu chí rule-based (mục 5.4) — backend là nguồn dữ liệu duy nhất ---
  const academicScore = scoreAcademic(profile.gpa.normalized);
  const languageResult = scoreLanguage(profile.english, profile.german);
  const financialScore = scoreFinancial(profile.annualBudget.eur);
  const certificateScore = scoreCertificate(profile.academicCertificates, profile.targetDegree);

  const ruleCriteria: Criterion[] = [
    { id: "academic", status: "evaluated", score: academicScore, comment: academicComment(academicScore) },
    languageResult.status === "evaluated"
      ? {
          id: "language",
          status: "evaluated",
          score: languageResult.score,
          comment: languageComment(languageResult.score),
        }
      : { id: "language", status: "not_evaluated" },
    { id: "financial", status: "evaluated", score: financialScore, comment: financialComment(financialScore) },
    {
      id: "certificate",
      status: "evaluated",
      score: certificateScore,
      comment: certificateComment(certificateScore, profile.targetDegree),
    },
  ];

  const ruleScores = {
    academic: academicScore,
    language: languageResult.status === "evaluated" ? languageResult.score : null,
    financial: financialScore,
    certificate: certificateScore,
  };

  // --- 4 tiêu chí AI (mục 5.5 / 5.11) — lỗi không chặn flow, đánh dấu not_evaluated ---
  const aiResult = await generateInsightWithAi(profile, ruleScores);

  let aiCriteria: Criterion[];
  let overallComment: string;
  let nextActions: string[];

  if (aiResult.ok) {
    const ai = aiResult.data;
    aiCriteria = [
      { id: "experience", status: "evaluated", score: ai.experience.score, comment: ai.experience.comment },
      { id: "research", status: "evaluated", score: ai.research.score, comment: ai.research.comment },
      { id: "leadership", status: "evaluated", score: ai.leadership.score, comment: ai.leadership.comment },
      { id: "major_fit", status: "evaluated", score: ai.major_fit.score, comment: ai.major_fit.comment },
    ];
    overallComment = ai.overall_comment;
    nextActions = ai.next_actions.slice(0, 5);
  } else {
    aiCriteria = [
      { id: "experience", status: "not_evaluated" },
      { id: "research", status: "not_evaluated" },
      { id: "leadership", status: "not_evaluated" },
      { id: "major_fit", status: "not_evaluated" },
    ];
    overallComment =
      "AI tạm thời không khả dụng nên chưa thể đánh giá các tiêu chí mềm (Kinh nghiệm, Nghiên cứu, Ngoại khóa, Phù hợp ngành). Điểm tổng được tính trên các tiêu chí còn lại.";
    nextActions = [];
  }

  const criteria = [...ruleCriteria, ...aiCriteria];
  const { overallScore, classification, evaluatedCount } = computeOverallScore(
    criteria,
    profile.targetDegree
  );

  const result: InsightResult = {
    criteria,
    overallScore,
    classification,
    overallComment,
    nextActions,
    evaluatedCount,
  };

  return NextResponse.json({ ok: true, insight: result });
}
