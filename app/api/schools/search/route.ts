import { NextResponse } from "next/server";
import { schoolsSearchRequestSchema } from "@/lib/validation/schemas";
import { queryPrograms } from "@/lib/db/schoolDatabase";
import { computeMatchScore, buildMatchSummary } from "@/lib/rules/matchScore";
import { buildBudgetSuggestion } from "@/lib/rules/budgetSuggestion";
import { resolveSchoolLogo, resolveSchoolImage } from "@/lib/config/universityImages";
import type { MatchedProgram } from "@/types/domain";

export const runtime = "nodejs";

// School Matching (mục 6, viết lại hoàn toàn ở v4) — thuần DB query trên School Database,
// KHÔNG còn gọi AI (mục 3.3/9: "School Search" AI call đã bị loại bỏ). Major Fit tái sử
// dụng điểm đã tính ở Insight (P2), client truyền kèm — P3 "không tính lại điểm hồ sơ"
// (mục 1.5), và không tính lại theo từng chương trình cụ thể (mục 3.3).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schoolsSearchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Request không hợp lệ.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { profile, majorFitScore } = parsed.data;

  // Query Builder (mục 6.2/6.3): Target Degree + Interested Major (đã chuẩn hóa theo Supported
  // Major Taxonomy ở form, mục 4.4) — nếu chọn nhiều Major, hợp nhất kết quả, loại trùng theo
  // Program.id (đã xử lý trong queryPrograms).
  const programs = queryPrograms({
    degree: profile.targetDegree,
    majorCategories: profile.interestedMajors,
  });

  // DB Query trả về rỗng (mục 6.14) — không phải lỗi, catalog chưa có chương trình khớp.
  if (programs.length === 0) {
    return NextResponse.json({
      ok: true,
      schools: [],
      message:
        "March hiện chưa có chương trình phù hợp với lựa chọn của bạn trong catalog. Catalog đang được mở rộng liên tục — bạn có thể thử điều chỉnh ngành quan tâm hoặc quay lại sau.",
    });
  }

  const schools: MatchedProgram[] = programs.map((program) => {
    const { matchScore, matchLevel, matchLevelExplanation, verdictLine, fitBreakdown } = computeMatchScore(
      profile,
      program,
      majorFitScore
    );
    const summary = buildMatchSummary(profile, program, majorFitScore);
    const budgetSuggestion = buildBudgetSuggestion(program.tuitionFeePerYearEur);
    const logo = resolveSchoolLogo(program.university, program.logo);
    const image = resolveSchoolImage(program.university, program.image);

    return {
      programId: program.id,
      university: program.university,
      program: program.program,
      officialUrl: program.officialUrl,
      matchScore,
      matchLevel,
      matchLevelExplanation,
      verdictLine,
      rankingTier: program.rankingTier,
      fitBreakdown,
      summary,
      budgetSuggestion,
      scholarships: program.scholarships,
      logo,
      image,
      lastVerifiedAt: program.lastVerifiedAt,
    };
  });

  // Sorting (mục 6.11/6.12): Match Score giảm dần, sau đó University Name A-Z.
  schools.sort((a, b) => b.matchScore - a.matchScore || a.university.localeCompare(b.university));

  return NextResponse.json({
    ok: true,
    schools: schools.slice(0, 10),
  });
}
