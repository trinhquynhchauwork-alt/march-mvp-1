import Groq from "groq-sdk";

// AI Layer (mục 15.3) — chỉ còn 2 call/phiên ở v4 (CV Parse, Insight, mục 3.3/9). School
// Search AI call đã bị loại bỏ hoàn toàn — không có provider nào khác cần gọi ngoài đây.

// Groq client khởi tạo LAZY (không phải top-level) — SDK ném lỗi ngay trong constructor nếu
// thiếu apiKey, nên nếu tạo unconditionally ở module scope thì deploy sẽ FAIL ngay lúc build
// (Next.js "collect page data") dù AI_PROVIDER đang chọn openai/deepseek, không hề dùng đến
// Groq — đã gặp thật khi deploy lên Vercel không set GROQ_API_KEY (bug 18/09).
let groqClient: Groq | null = null;
function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY chưa được cấu hình trong .env.local.");
  if (!groqClient) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqClient;
}

// llama-3.3-70b-versatile đã bị Groq gỡ khỏi catalog (404 model_not_found) — đổi sang
// openai/gpt-oss-120b, model text hiện có trên Groq tại thời điểm build. Nếu Groq đổi
// catalog lần nữa, set GROQ_TEXT_MODEL trong env để không phải sửa code.
const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? "openai/gpt-oss-120b";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Provider chọn qua AI_PROVIDER=groq|deepseek|openai (mặc định "groq"). Key user đưa lúc
// chuyển sang v4 có định dạng `sk-proj-...` — đã test trực tiếp và xác nhận đây là key OpenAI
// hợp lệ (không phải DeepSeek như dự đoán ban đầu, DeepSeek trả 401 với key này). Vì vậy thêm
// hẳn provider "openai" thay vì ép dùng qua endpoint DeepSeek.
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

async function completeWithOpenAI(systemPrompt: string, userContent: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY chưa được cấu hình trong .env.local.");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI API lỗi ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function completeWithGroq(systemPrompt: string, userContent: string): Promise<string> {
  const completion = await getGroqClient().chat.completions.create({
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
  if (AI_PROVIDER === "deepseek") return completeWithDeepSeek(systemPrompt, userContent);
  if (AI_PROVIDER === "openai") return completeWithOpenAI(systemPrompt, userContent);
  return completeWithGroq(systemPrompt, userContent);
}
