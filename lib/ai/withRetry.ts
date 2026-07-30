import type { ZodType } from "zod";
import { AI_RETRY_COUNT } from "@/lib/config/constants";

export type AiJsonResult<T> = { ok: true; data: T } | { ok: false; error: string };

// AI đôi khi vẫn bọc JSON trong ```json fence dù đã được yêu cầu không làm vậy —
// strip phòng hờ trước khi parse, không coi đó là lỗi.
function stripMarkdownFence(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

// Groq trả kèm gợi ý "Please try again in X.Xs" khi bị rate limit (429) — đọc gợi ý này
// trước khi retry thay vì retry ngay lập tức, để không trượt lại rate limit lần 2.
// Cap ở 5s để không vi phạm ngân sách hiệu năng (mục 12: School Search < 20s).
function retryAfterSeconds(message: string): number {
  const match = message.match(/try again in ([\d.]+)s/i);
  return match ? Math.min(Number(match[1]), 5) : 0;
}

// Retry 1 lần khi JSON invalid hoặc timeout/lỗi API (spec mục 4.9 / 5.11 / 11).
// Log latency/retry/failure theo mục 12 — không log nội dung CV hay payload thật.
export async function callAiJson<T>(
  label: string,
  fn: () => Promise<string>,
  schema: ZodType<T>,
  retries: number = AI_RETRY_COUNT
): Promise<AiJsonResult<T>> {
  let lastError = "unknown error";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const start = Date.now();
    try {
      const raw = await fn();
      const latencyMs = Date.now() - start;
      const cleaned = stripMarkdownFence(raw);
      const parsed = JSON.parse(cleaned);
      const result = schema.safeParse(parsed);
      if (result.success) {
        console.info(`[ai:${label}] ok attempt=${attempt + 1} latencyMs=${latencyMs}`);
        return { ok: true, data: result.data };
      }
      lastError = `Schema validation failed: ${result.error.message}`;
      console.warn(`[ai:${label}] invalid_response attempt=${attempt + 1} latencyMs=${latencyMs}`);
    } catch (err) {
      const latencyMs = Date.now() - start;
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[ai:${label}] error attempt=${attempt + 1} latencyMs=${latencyMs} message=${lastError}`);

      const waitSec = retryAfterSeconds(lastError);
      if (waitSec > 0 && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
      }
    }
  }

  console.error(`[ai:${label}] failed after ${retries + 1} attempts: ${lastError}`);
  return { ok: false, error: lastError };
}
