import { NextResponse } from "next/server";
import { extractTextFromPdf } from "@/lib/parsers/pdf";
import { extractTextFromDocx } from "@/lib/parsers/docx";
import { parseCvWithAi } from "@/lib/ai/prompts/cvParsing";
import { normalizeGpa } from "@/lib/normalize/gpa";
import { ENGLISH_CERT_TYPES, GERMAN_CERT_TYPES, CEFR_LEVELS } from "@/lib/config/formOptions";
import type { CvParseRaw, ProfileDraft } from "@/types/domain";

export const runtime = "nodejs";

// AI thỉnh thoảng trả biến thể ("IELTS Academic" thay vì "IELTS") dù prompt đã ràng buộc
// enum — snap về giá trị chuẩn khớp option trong form; không đoán được thì để trống thay
// vì nhét giá trị sai (mục 4.7: không suy diễn).
function matchEnum(value: string, options: readonly string[]): string | null {
  const lower = value.toLowerCase();
  return options.find((opt) => lower.includes(opt.toLowerCase())) ?? null;
}

function draftFromCvParse(raw: CvParseRaw): ProfileDraft {
  const draft: ProfileDraft = {};

  if (raw.current_education) draft.currentEducation = raw.current_education;

  if (raw.gpa != null && raw.gpa_scale != null) {
    draft.gpa = {
      original: raw.gpa,
      scale: raw.gpa_scale,
      normalized: normalizeGpa(raw.gpa, raw.gpa_scale),
    };
  }

  if (raw.english?.type && raw.english.score != null) {
    const type = matchEnum(raw.english.type, ENGLISH_CERT_TYPES);
    if (type) draft.english = { type, score: raw.english.score };
  }

  if (raw.german?.type && raw.german.level) {
    const type = matchEnum(raw.german.type, GERMAN_CERT_TYPES);
    const level = matchEnum(raw.german.level, CEFR_LEVELS);
    if (type && level) draft.german = { type, level };
  }

  if (raw.academic_certificates && raw.academic_certificates.length > 0) {
    // AI có thể trả score:null khi CV không ghi kèm điểm (mục 4.7 — không suy diễn).
    // Giữ lại tên chứng chỉ, để trống score cho user tự điền.
    draft.academicCertificates = raw.academic_certificates
      .filter((c) => c.name)
      .map((c) => ({ name: c.name as string, score: c.score ?? "" }));
  }

  if (raw.major && raw.major.length > 0) draft.interestedMajors = raw.major;
  if (raw.activities) draft.activities = raw.activities;
  if (raw.experience) draft.experience = raw.experience;
  if (raw.research) draft.research = raw.research;

  return draft;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Thiếu file CV." }, { status: 400 });
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx");

  if (!isPdf && !isDocx) {
    return NextResponse.json(
      { ok: false, error: "Chỉ hỗ trợ file PDF hoặc DOCX." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let cvText: string;
  try {
    cvText = isPdf ? await extractTextFromPdf(buffer) : await extractTextFromDocx(buffer);
  } catch (err) {
    console.error("[profile/parse] extract error:", err);
    return NextResponse.json(
      { ok: false, error: "Không đọc được nội dung file. Vui lòng upload lại." },
      { status: 400 }
    );
  }

  if (!cvText.trim()) {
    return NextResponse.json(
      { ok: false, error: "File không chứa nội dung text đọc được." },
      { status: 400 }
    );
  }

  // Parse Failed (mục 4.9): retry đã nằm trong parseCvWithAi. Nếu vẫn lỗi -> không chặn
  // flow, trả ok:false để frontend hiển thị form trống cho nhập thủ công.
  const result = await parseCvWithAi(cvText);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "AI parse thất bại. Vui lòng nhập thủ công." });
  }

  return NextResponse.json({ ok: true, draft: draftFromCvParse(result.data) });
}
