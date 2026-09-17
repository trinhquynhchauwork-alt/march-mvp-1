#!/usr/bin/env node
/**
 * fetch-school-images.mjs
 * ------------------------------------------------------------------
 * Script dev-time (KHÔNG chạy lúc runtime của app) — đọc programs.seed.json,
 * với mỗi trường (university) còn thiếu file ảnh cục bộ, tự tra Wikidata API
 * để lấy logo (P154) và ảnh chính/khuôn viên (P18), tải về đúng path đã
 * được khai báo sẵn trong seed JSON (logo.logoUrl / image.imageUrl).
 *
 * Đúng theo PRD mục 15.7 — March MVP v4.3:
 *  - Chỉ chạy 1 lần lúc chuẩn bị seed data (dev-time), KHÔNG gọi lúc user dùng app.
 *  - Có fallback: trường không tìm được ảnh trên Wikidata sẽ bị SKIP (giữ nguyên
 *    monogram/placeholder ở phía UI theo mục 7.9), không làm script chết giữa chừng.
 *  - KHÔNG dùng cho production khi chưa qua xác minh bản quyền logo (mục 15.7).
 *
 * Yêu cầu: Node.js 18+ (dùng fetch/fs built-in, không cần cài thêm package nào).
 *
 * Cách chạy (từ thư mục gốc march-mvp):
 *   node scripts/fetch-school-images.mjs
 *   node scripts/fetch-school-images.mjs --seed ./lib/db/programs.seed.json --public ./public
 *   node scripts/fetch-school-images.mjs --force        (tải lại cả file đã tồn tại)
 *
 * Sau khi chạy xong, đọc summary in ra cuối script để biết trường nào
 * chưa lấy được ảnh (cần bổ sung thủ công hoặc chấp nhận dùng placeholder).
 * ------------------------------------------------------------------
 */

import fs from "node:fs/promises";
import path from "node:path";

// ---------- Config ----------
const args = process.argv.slice(2);
function getArg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const SEED_PATH = getArg("seed", "./lib/db/programs.seed.json");
const PUBLIC_DIR = getArg("public", "./public");
const FORCE = args.includes("--force");
const REQUEST_DELAY_MS = 350; // lịch sự với Wikidata/Wikimedia API, tránh bị rate-limit
const USER_AGENT = "MarchMVP-ImageFetcher/1.0 (dev-time seed script; contact: set-your-email-here)";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_FILEPATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";

// ---------- Helpers ----------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function wikidataSearchEntity(name) {
  const url = new URL(WIKIDATA_API);
  url.search = new URLSearchParams({
    action: "wbsearchentities",
    search: name,
    language: "en",
    format: "json",
    type: "item",
    limit: "3",
  }).toString();

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`wbsearchentities HTTP ${res.status}`);
  const data = await res.json();
  if (!data.search || data.search.length === 0) return null;

  // Ưu tiên kết quả có description chứa "university" hoặc "school" để giảm nhầm entity
  const preferred = data.search.find((s) =>
    /university|hochschule|institute|school of/i.test(s.description || "")
  );
  return (preferred || data.search[0]).id; // Q-id
}

async function wikidataGetClaimImage(qid, property) {
  const url = new URL(WIKIDATA_API);
  url.search = new URLSearchParams({
    action: "wbgetclaims",
    entity: qid,
    property,
    format: "json",
  }).toString();

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`wbgetclaims HTTP ${res.status}`);
  const data = await res.json();
  const claims = data.claims?.[property];
  if (!claims || claims.length === 0) return null;
  const filename = claims[0]?.mainsnak?.datavalue?.value;
  return filename || null; // tên file trên Commons, vd "TUM Logo.svg"
}

async function downloadCommonsFile(filename, destPath) {
  const url = COMMONS_FILEPATH + encodeURIComponent(filename);
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
  if (!res.ok) throw new Error(`download HTTP ${res.status} cho file ${filename}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buf);
  return buf.length;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ---------- Main ----------
async function main() {
  console.log(`Đọc seed từ: ${SEED_PATH}`);
  const raw = await fs.readFile(SEED_PATH, "utf-8");
  const seed = JSON.parse(raw);
  const programs = seed.programs || [];

  // Gom theo university, chỉ xử lý mỗi trường 1 lần dù có nhiều chương trình trùng trường
  const byUniversity = new Map();
  for (const p of programs) {
    if (!byUniversity.has(p.university)) {
      byUniversity.set(p.university, {
        university: p.university,
        logoUrl: p.logo?.logoUrl || null,
        imageUrl: p.image?.imageUrl || null,
      });
    }
  }

  console.log(`Tìm thấy ${byUniversity.size} trường duy nhất cần xử lý.\n`);

  const summary = { ok: [], skippedExisting: [], notFoundOnWikidata: [], failed: [] };

  for (const { university, logoUrl, imageUrl } of byUniversity.values()) {
    console.log(`→ ${university}`);
    try {
      const logoDest = logoUrl ? path.join(PUBLIC_DIR, logoUrl.replace(/^\//, "")) : null;
      const imageDest = imageUrl ? path.join(PUBLIC_DIR, imageUrl.replace(/^\//, "")) : null;

      const logoAlreadyThere = logoDest && !FORCE && (await fileExists(logoDest));
      const imageAlreadyThere = imageDest && !FORCE && (await fileExists(imageDest));

      if (logoAlreadyThere && imageAlreadyThere) {
        console.log("  ✓ đã có sẵn file, bỏ qua (dùng --force để tải lại)");
        summary.skippedExisting.push(university);
        continue;
      }

      const qid = await wikidataSearchEntity(university);
      await sleep(REQUEST_DELAY_MS);
      if (!qid) {
        console.log("  ✗ không tìm thấy entity trên Wikidata");
        summary.notFoundOnWikidata.push(university);
        continue;
      }

      let gotLogo = logoAlreadyThere;
      let gotImage = imageAlreadyThere;

      if (logoDest && !logoAlreadyThere) {
        const logoFile = await wikidataGetClaimImage(qid, "P154"); // logo image
        await sleep(REQUEST_DELAY_MS);
        if (logoFile) {
          const bytes = await downloadCommonsFile(logoFile, logoDest);
          console.log(`  ✓ logo tải xong (${(bytes / 1024).toFixed(1)} KB) → ${logoDest}`);
          gotLogo = true;
        } else {
          console.log("  · không có logo (P154) trên Wikidata — giữ fallback monogram");
        }
      }

      if (imageDest && !imageAlreadyThere) {
        const imageFile = await wikidataGetClaimImage(qid, "P18"); // ảnh chính/khuôn viên
        await sleep(REQUEST_DELAY_MS);
        if (imageFile) {
          const bytes = await downloadCommonsFile(imageFile, imageDest);
          console.log(`  ✓ ảnh khuôn viên tải xong (${(bytes / 1024).toFixed(1)} KB) → ${imageDest}`);
          gotImage = true;
        } else {
          console.log("  · không có ảnh (P18) trên Wikidata — giữ fallback placeholder");
        }
      }

      if (gotLogo || gotImage) {
        summary.ok.push(university);
      } else {
        summary.notFoundOnWikidata.push(university);
      }
    } catch (err) {
      console.log(`  ✗ lỗi: ${err.message}`);
      summary.failed.push({ university, error: err.message });
    }
    console.log("");
  }

  console.log("=".repeat(60));
  console.log("TỔNG KẾT");
  console.log("=".repeat(60));
  console.log(`✓ Lấy được ảnh mới:      ${summary.ok.length}`);
  summary.ok.forEach((u) => console.log(`   - ${u}`));
  console.log(`· Đã có sẵn, bỏ qua:     ${summary.skippedExisting.length}`);
  console.log(`· Không có trên Wikidata (fallback monogram/placeholder): ${summary.notFoundOnWikidata.length}`);
  summary.notFoundOnWikidata.forEach((u) => console.log(`   - ${u}`));
  console.log(`✗ Lỗi kỹ thuật:          ${summary.failed.length}`);
  summary.failed.forEach((f) => console.log(`   - ${f.university}: ${f.error}`));
  console.log("");
  console.log("Nhắc lại (PRD mục 15.7): ảnh lấy qua Wikidata chỉ dùng cho dev/demo.");
  console.log("Trước khi lên production PHẢI xác minh bản quyền logo từng trường.");
}

main().catch((err) => {
  console.error("Script lỗi:", err);
  process.exit(1);
});
