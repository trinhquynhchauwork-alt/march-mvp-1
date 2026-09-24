import { completeJson } from "@/lib/ai/aiClient";
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
  "german": { "type": "Goethe" | "TestDaF" | "DSH" | "telc" | null, "level": string | null } | null,
  // "level" là trình độ GỐC của chứng chỉ: với Goethe/telc dùng CEFR ("A1".."C2");
  // với TestDaF dùng thang TDN ("TDN 3", "TDN 4", "TDN 5"); với DSH dùng ("DSH-1", "DSH-2", "DSH-3").
  "academic_certificates": [ { "name": string | null, "score": string | null } ] | null,
  // "major": CHỈ được chọn từ đúng 7 giá trị sau (khớp chính xác chuỗi, không dịch/diễn giải):
  // "Computer Science", "Data Science / AI", "Business & Management", "Economics",
  // "Mechanical Engineering", "Electrical Engineering", "Civil Engineering".
  // Nếu ngành trong CV không rõ ràng khớp với 1 trong 7 giá trị trên, trả về null (không suy
  // diễn/không tự ánh xạ ngành gần giống) — form sẽ để trống cho user tự chọn tay.
  "major": string[] | null,
  "experience": string | null,
  "research": string | null,
  "activities": string | null
}`;

export async function parseCvWithAi(cvText: string): Promise<AiJsonResult<CvParseRaw>> {
  return callAiJson(
    "cv_parse",
    () => completeJson(SYSTEM_PROMPT, JSON.stringify({ cv_text: cvText })),
    cvParseRawSchema
  );
}
