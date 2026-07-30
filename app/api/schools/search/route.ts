import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/validation/schemas";
import { buildSearchQuery } from "@/lib/rules/searchQuery";
import { searchSchoolsWithAi } from "@/lib/ai/prompts/schoolSearch";
import { computeMatchScore } from "@/lib/rules/matchScore";
import { resolveWorkingUrls } from "@/lib/validation/urlReachability";
import type { MatchedSchool } from "@/types/domain";

export const runtime = "nodejs";

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function dedupeKey(university: string, program: string): string {
  return `${university.trim().toLowerCase()}::${program.trim().toLowerCase()}`;
}

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
  const query = buildSearchQuery(profile);

  // Search Failed / Retry Failed (mục 6.11): retry đã nằm trong searchSchoolsWithAi.
  // Nếu vẫn lỗi -> trả empty list, không crash (AC4).
  const aiResult = await searchSchoolsWithAi(query, profile);

  if (!aiResult.ok) {
    return NextResponse.json({
      ok: true,
      schools: [],
      message: "Không tìm thấy chương trình phù hợp.",
    });
  }

  // Program Validation (mục 6.5): bắt buộc university + program + official_url hợp lệ.
  const seen = new Set<string>();
  const candidates: { university: string; program: string; officialUrl: string }[] = [];

  for (const candidate of aiResult.data) {
    const university = candidate.university?.trim();
    const program = candidate.program?.trim();
    const officialUrl = candidate.official_url?.trim();

    if (!university || !program || !officialUrl || !isValidUrl(officialUrl)) continue;

    const key = dedupeKey(university, program);
    if (seen.has(key)) continue;
    seen.add(key);

    candidates.push({ university, program, officialUrl });
  }

  // Xác thực URL (AI có web search thật nhưng vẫn có thể tự ghép sai một deep link cụ thể):
  // link chết -> thử fallback domain gốc của chính trường đó; chỉ loại hẳn khi cả hai đều
  // chết. Giới hạn concurrency để tránh bị site chặn hàng loạt do burst traffic.
  const resolvedUrls = await resolveWorkingUrls(candidates.map((c) => c.officialUrl));
  const droppedCount = resolvedUrls.filter((u) => u === null).length;
  if (droppedCount > 0) {
    console.warn(`[schools/search] dropped ${droppedCount}/${candidates.length} unreachable official_url`);
  }

  const schools: MatchedSchool[] = candidates
    .map((c, i) => ({ ...c, officialUrl: resolvedUrls[i] }))
    .filter((c): c is { university: string; program: string; officialUrl: string } => c.officialUrl !== null)
    .map((c) => ({ ...c, ...computeMatchScore(profile, c) }));

  // Sorting (mục 6.9): Match Score giảm dần, sau đó University Name A-Z.
  schools.sort((a, b) => b.matchScore - a.matchScore || a.university.localeCompare(b.university));

  return NextResponse.json({
    ok: true,
    schools: schools.slice(0, 10),
    message: schools.length === 0 ? "Không tìm thấy chương trình phù hợp." : undefined,
  });
}
