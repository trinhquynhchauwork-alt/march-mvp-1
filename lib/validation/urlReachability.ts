// Xác thực Official URL trước khi trả về (mở rộng Program Validation ở mục 6.5).
//
// Quan sát thực tế: dù được yêu cầu chỉ copy URL thật từ web search, AI vẫn hay tự ghép
// deep-link theo khuôn mẫu (vd "/en/study/computer-science-msc/" lặp lại y hệt cho hàng
// loạt trường khác nhau) — tên trường/chương trình đúng nhưng path cụ thể sai/lỗi thời.
// Thay vì loại bỏ cả trường khi deep-link chết, thử lại bằng domain gốc của chính trường
// đó (gần như luôn còn sống) — vẫn đưa user đến đúng trang chính thức, chỉ là trang chủ
// thay vì trang con. Chỉ loại hẳn khi cả domain gốc cũng chết.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// Chỉ coi là "chết" khi server trả 404/410 rõ ràng — đúng loại lỗi user báo ("page not
// found"). KHÔNG coi timeout/network error là chết: nhiều trang .de có WAF/rate-limit,
// một request đơn lẻ timeout không có nghĩa link sai.
async function probe(url: string, timeoutMs = 6000): Promise<{ dead: boolean; status?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": BROWSER_USER_AGENT },
    });

    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": BROWSER_USER_AGENT },
      });
    }

    return { dead: res.status === 404 || res.status === 410, status: res.status };
  } catch {
    return { dead: false }; // timeout/network hiccup -> benefit of doubt
  } finally {
    clearTimeout(timer);
  }
}

// Trả về URL dùng được cho candidate, hoặc null nếu cả deep-link lẫn domain gốc đều chết.
async function resolveWorkingUrl(url: string): Promise<string | null> {
  const direct = await probe(url);
  if (!direct.dead) {
    console.info(`[urlCheck] ${direct.status ?? "err"} ok ${url}`);
    return url;
  }

  let origin: string;
  try {
    origin = new URL(url).origin + "/";
  } catch {
    console.info(`[urlCheck] ${direct.status} DEAD (invalid url) ${url}`);
    return null;
  }

  if (origin === url) {
    console.info(`[urlCheck] ${direct.status} DEAD (root domain also dead) ${url}`);
    return null;
  }

  const fallback = await probe(origin);
  if (!fallback.dead) {
    console.info(`[urlCheck] ${direct.status} DEAD -> fallback root ok ${url} => ${origin}`);
    return origin;
  }

  console.info(`[urlCheck] ${direct.status} DEAD, root also dead ${url}`);
  return null;
}

// Giới hạn số request đồng thời — chạy hết N URL cùng lúc dễ bị site nhận diện là burst
// traffic và chặn hàng loạt (kể cả với URL đúng), làm sai lệch kết quả kiểm tra.
export async function resolveWorkingUrls(
  urls: string[],
  concurrency = 4
): Promise<(string | null)[]> {
  const results = new Array<string | null>(urls.length);
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const i = cursor++;
      results[i] = await resolveWorkingUrl(urls[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return results;
}
