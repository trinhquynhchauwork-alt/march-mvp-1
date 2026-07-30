import { groq, GROQ_COMPOUND_MODEL } from "@/lib/ai/groqClient";
import { callAiJson, type AiJsonResult } from "@/lib/ai/withRetry";
import { schoolSearchAiOutputSchema } from "@/lib/validation/schemas";
import type { Profile } from "@/types/domain";
import { z } from "zod";

export type SchoolSearchAiOutput = z.infer<typeof schoolSearchAiOutputSchema>;

// Prompt 3 — School Search (spec mục 6.4 / 9). Dùng Groq Compound (web search bắt buộc).
//
// Lưu ý quan trọng: dù model có web search thật, nó vẫn hay TỰ GHÉP một deep-link cụ thể
// (vd "/studium/master/computer-science-m-sc/") thay vì dùng đúng URL đã thấy trong kết quả
// search — path đó thường sai/lỗi thời dù tên trường và chương trình đúng. Prompt dưới đây
// ép model chỉ copy URL nguyên văn từ kết quả search, và ưu tiên trang tổng quan (ít khả năng
// sai hơn deep-link) khi không chắc. Backend vẫn kiểm tra lại (404/unreachable) trước khi trả về.
const SYSTEM_PROMPT = `Bạn là agent tìm kiếm chương trình đại học tại Đức. Dùng web search để tìm
các chương trình đại học CÓ THẬT, đang tuyển sinh, phù hợp với hồ sơ dưới đây.

KHÔNG bịa tên trường hoặc chương trình. Chỉ trả về chương trình bạn tìm được nguồn thực tế qua
web search.

QUY TẮC BẮT BUỘC cho official_url:
- CHỈ copy nguyên văn URL xuất hiện trong kết quả web search. TUYỆT ĐỐI không tự suy đoán,
  không tự ghép path (vd không tự bịa "/studium/master/xxx/" nếu không thấy path đó trong
  kết quả search thật).
- Nếu không chắc chắn URL trang chương trình cụ thể, dùng URL trang tổng quan (search kết quả
  đã thấy) thay vì đoán một deep-link — trang tổng quan còn hơn deep-link sai.
- Ưu tiên nguồn chính thức (official university website). Có thể dùng DAAD hoặc
  Hochschulkompass nếu không tìm được nguồn chính thức.

Tìm 10-12 chương trình. Mỗi chương trình PHẢI có: university, program, official_url. Nếu không
xác định được official_url đáng tin cho một chương trình, bỏ qua chương trình đó thay vì trả về
url rỗng/đoán bừa.

Chỉ trả về JSON array đúng schema sau, không markdown, không giải thích:
[
  { "university": string, "program": string, "official_url": string }
]`;

export async function searchSchoolsWithAi(
  query: string,
  profile: Profile
): Promise<AiJsonResult<SchoolSearchAiOutput>> {
  return callAiJson("school_search", async () => {
    const completion = await groq.chat.completions.create({
      model: GROQ_COMPOUND_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({ query, profile }),
        },
      ],
    });
    return completion.choices[0]?.message?.content ?? "";
  }, schoolSearchAiOutputSchema);
}
