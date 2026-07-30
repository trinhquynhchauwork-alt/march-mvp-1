import Groq from "groq-sdk";

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Model cho tác vụ text thường (CV Parsing, Insight) — hỗ trợ JSON mode.
export const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? "llama-3.3-70b-versatile";

// Model có web search bắt buộc (School Search) — spec gọi là "Groq Compound Search".
// Dùng bản "-mini" (Llama 3.3 cho cả reasoning lẫn tool-routing): 1 lần gọi tốn ~4k token
// thay vì gần chạm trần 30k TPM của tier on_demand ở bản đầy đủ — tránh rate limit 429/413.
export const GROQ_COMPOUND_MODEL = process.env.GROQ_COMPOUND_MODEL ?? "groq/compound-mini";
