import { groq, GROQ_TEXT_MODEL } from "@/lib/ai/groqClient";
import { callAiJson, type AiJsonResult } from "@/lib/ai/withRetry";
import { cvParseRawSchema } from "@/lib/validation/schemas";
import type { CvParseRaw } from "@/types/domain";

// Prompt 1 — CV Parsing (spec mục 4.7 / 4.8 / 9).
const SYSTEM_PROMPT = `Bạn là trợ lý trích xuất thông tin từ CV để điền form hồ sơ du học Đức.
Bạn CHỈ được phép:
- Trích xuất thông tin có trong CV.
- Chuẩn hóa dữ liệu.
- Tóm tắt hoạt động.

Bạn KHÔNG được:
- Suy diễn GPA.
- Suy diễn chứng chỉ.
- Suy diễn ngành học.
- Tự tạo dữ liệu không tồn tại.

Nếu không chắc chắn về một field, trả về null cho field đó.

Chỉ trả về một object JSON đúng schema sau, không markdown, không giải thích:
{
  "current_education": "Lớp 10" | "Lớp 11" | "Lớp 12" | "Chưa tốt nghiệp ĐH" | "Đã tốt nghiệp ĐH" | null,
  "gpa": number | null,
  "gpa_scale": number | null,
  "english": { "type": "IELTS" | "TOEFL" | null, "score": number | null } | null,
  "german": { "type": "Goethe" | "TestDaF" | "DSH" | "telc" | null, "level": "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null } | null,
  "academic_certificates": [ { "name": string | null, "score": string | null } ] | null,
  "major": string[] | null,
  "experience": string | null,
  "research": string | null,
  "activities": string | null
}`;

export async function parseCvWithAi(cvText: string): Promise<AiJsonResult<CvParseRaw>> {
  return callAiJson("cv_parse", async () => {
    const completion = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify({ cv_text: cvText }) },
      ],
    });
    return completion.choices[0]?.message?.content ?? "";
  }, cvParseRawSchema);
}
