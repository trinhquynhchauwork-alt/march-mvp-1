import Groq from "groq-sdk";

// AI Layer (mục 15.3) — chỉ còn 2 call/phiên ở v4 (CV Parse, Insight, mục 3.3/9). School
// Search AI call đã bị loại bỏ hoàn toàn — không có provider nào khác cần gọi ngoài đây.

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// llama-3.3-70b-versatile đã bị Groq gỡ khỏi catalog (404 model_not_found) — đổi sang
// openai/gpt-oss-120b, model text hiện có trên Groq tại thời điểm build. Nếu Groq đổi
// catalog lần nữa, set GROQ_TEXT_MODEL trong env để không phải sửa code.
const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? "openai/gpt-oss-120b";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

// Provider chọn qua AI_PROVIDER=groq|deepseek (mặc định "groq"). Key DeepSeek user cung cấp
// khi yêu cầu chuyển sang v4 đã được test trực tiếp (1 request thô, ngoài code này) tới
// https://api.deepseek.com — trả về 401 "invalid api key". Định dạng key (`sk-proj-...`)
// cũng khớp key OpenAI hơn là key DeepSeek thông thường (`sk-...` không có `-proj-`) — nhiều
// khả năng dán nhầm key OpenAI hoặc key đã hết hạn/copy thiếu ký tự, CẦN xác nhận lại với
// user trước khi dùng thật. Giữ Groq (key hiện tại đang hoạt động) làm mặc định để app không
// bị gãy; đổi AI_PROVIDER=deepseek trong .env.local sau khi có key DeepSeek hợp lệ.
const AI_PROVIDER = (process.env.AI_PROVIDER ?? "groq").toLowerCase();

async function completeWithDeepSeek(systemPrompt: string, userContent: string): Promise<string> {
  if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY chưa được cấu hình trong .env.local.");

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DeepSeek API lỗi ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function completeWithGroq(systemPrompt: string, userContent: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

// Dùng chung cho cả 2 AI call (CV Parsing, Insight) — cả hai đều yêu cầu structured JSON
// output (mục 15.3). Timeout/retry xử lý ở lib/ai/withRetry.ts, không phải ở đây.
export async function completeJson(systemPrompt: string, userContent: string): Promise<string> {
  return AI_PROVIDER === "deepseek" ? completeWithDeepSeek(systemPrompt, userContent) : completeWithGroq(systemPrompt, userContent);
}
