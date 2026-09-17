import seedData from "@/lib/db/programs.seed.json";
import type { Program } from "@/types/domain";

// School Database (mục 6.4, 7.8, 13) — nguồn dữ liệu chương trình do Content/Backend team
// curate và xác minh thủ công. Ở MVP dev/demo, "DB" là file seed đính kèm (mục 15.5) — KHÔNG
// tự thêm record ngoài seed file (mục 15.6). Đây là 1 module đọc dữ liệu tĩnh với interface
// query filter, thay được bằng Postgres/SQLite thật sau này mà không đổi call site (mục 15.1).
const PROGRAMS: Program[] = (seedData as { programs: Program[] }).programs;

// Dev/demo: cho phép "draft" xuất hiện để test UI có dữ liệu (mục 15.5) — chỉ khi đã thật sự
// curate xong (mục 13.3) mới nên khoá lại còn "active". KHÔNG dùng NODE_ENV để quyết định việc
// này — Vercel (và mọi host khác) luôn set NODE_ENV=production cho MỌI deployment, kể cả bản
// demo cá nhân, nên trước đây catalog trống trơn ngay khi deploy dù toàn bộ seed vẫn đang
// "draft" đúng thiết kế (bug 18/09 — chọn ngành nào trên bản live cũng ra danh sách rỗng).
// Dùng cờ riêng, mặc định vẫn hiển thị draft cho tới khi ai đó chủ động bật cờ này lên.
const DEV_VISIBLE_STATUSES = new Set(["draft", "active"]);
const PROD_VISIBLE_STATUSES = new Set(["active"]);

function visibleStatuses(): Set<string> {
  return process.env.RESTRICT_TO_ACTIVE_PROGRAMS === "true" ? PROD_VISIBLE_STATUSES : DEV_VISIBLE_STATUSES;
}

export interface SchoolQuery {
  degree: Program["degree"];
  majorCategories: string[];
}

// Query Builder (mục 6.3): filter theo degree + majorCategory (hợp nhất nhiều Major, loại
// trùng theo Program.id, mục 6.3/4.4). Không lọc cứng theo Expected Intake — chỉ dùng để
// tham khảo, không loại chương trình (mục 6.3).
export function queryPrograms(query: SchoolQuery): Program[] {
  const statuses = visibleStatuses();
  const majors = new Set(query.majorCategories);

  const seen = new Set<string>();
  const result: Program[] = [];

  for (const program of PROGRAMS) {
    if (!statuses.has(program.status)) continue;
    if (program.degree !== query.degree) continue;
    if (!majors.has(program.majorCategory)) continue;
    if (seen.has(program.id)) continue;
    seen.add(program.id);
    result.push(program);
  }

  return result;
}
