import type { InsightResult, MatchedProgram } from "@/types/domain";
import { CRITERION_LABELS } from "@/lib/config/criterionLabels";
import { CLASSIFICATION_LABELS, MATCH_LEVEL_LABELS } from "@/lib/config/enumLabels";
import { priorityLabelFor } from "@/lib/config/actionTags";
import { formatScore10 } from "@/lib/config/score";

// jsPDF's built-in fonts (Helvetica...) chỉ hỗ trợ WinAnsi/Latin-1 — không có dấu tiếng Việt,
// khiến PDF xuất ra bị lỗi ký tự (report bug 24/09). Nhúng font Roboto bản "vietnamese" subset
// (đủ toàn bộ dấu, tải 1 lần lúc bấm Tải xuống, không bundle vào JS chính) để hiển thị đúng.
const FONT_REGULAR_URL = "/fonts/Roboto-Regular.ttf";
const FONT_BOLD_URL = "/fonts/Roboto-Bold.ttf";

// Chỉ 2 màu chữ (theo yêu cầu user 24/09 — bản trước dùng thêm 2 sắc xám phụ trông rối/xấu):
// hồng cho Title/số liệu nổi bật, đen cho toàn bộ nội dung còn lại.
const COLOR_PRIMARY: [number, number, number] = [235, 47, 150];
const COLOR_TEXT: [number, number, number] = [20, 20, 20];

async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Không tải được font ${url} (HTTP ${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function formatEur(value: number | null): string {
  return value != null ? `${value.toLocaleString("de-DE")} EUR` : "—";
}

// Xuất 1 file PDF duy nhất gộp cả "Việc cần làm tiếp theo" (P2) và "Danh sách chương trình
// phù hợp" (P3) — theo yêu cầu user (24/09): trước đây 2 khối này tách rời 2 trang, giờ dời
// chung về P3 và cho tải chung 1 file thay vì phải tải riêng từng phần.
export async function downloadReportPdf(insight: InsightResult, schools: MatchedProgram[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const [regularBase64, boldBase64] = await Promise.all([fetchFontBase64(FONT_REGULAR_URL), fetchFontBase64(FONT_BOLD_URL)]);
  doc.addFileToVFS("Roboto-Regular.ttf", regularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", boldBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 16;
  const bulletIndent = 5;
  const bulletTextIndent = 10;
  let y = 20;

  function ensureSpace(next: number) {
    if (y + next > bottomLimit) {
      doc.addPage();
      y = 20;
    }
  }

  // Title section — luôn hồng, đậm, đứng đầu mỗi khối nội dung.
  function sectionTitle(text: string, size = 13) {
    y += 3;
    ensureSpace(size * 0.6 + 4);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text(text, marginX, y);
    y += size * 0.55 + 3;
  }

  // Dòng chữ thường (đen) — dùng cho câu dẫn/số liệu tổng quan, KHÔNG phải danh sách.
  function plainText(text: string, opts?: { size?: number; bold?: boolean }) {
    const size = opts?.size ?? 10.5;
    doc.setFont("Roboto", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...COLOR_TEXT);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      ensureSpace(size * 0.55);
      doc.text(line, marginX, y);
      y += size * 0.55;
    }
  }

  // Explanation dạng bullet point (theo yêu cầu user 24/09) — "•" + hanging indent, đen.
  function bullet(text: string, opts?: { size?: number; bold?: boolean }) {
    const size = opts?.size ?? 10.5;
    doc.setFont("Roboto", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...COLOR_TEXT);
    const lines = doc.splitTextToSize(text, contentWidth - bulletTextIndent);
    lines.forEach((line: string, i: number) => {
      ensureSpace(size * 0.55);
      if (i === 0) doc.text("•", marginX + bulletIndent, y);
      doc.text(line, marginX + bulletTextIndent, y);
      y += size * 0.55;
    });
  }

  function link(text: string) {
    const size = 9.5;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...COLOR_PRIMARY);
    ensureSpace(size * 0.55);
    doc.text(text, marginX + bulletTextIndent, y);
    y += size * 0.55;
  }

  // ---------- Title ----------
  doc.setFont("Roboto", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text("March — Kết quả tư vấn du học", marginX, y);
  y += 7;
  plainText(`Xuất ngày ${new Date().toLocaleDateString("vi-VN")}`, { size: 9 });

  // ---------- Điểm hồ sơ ----------
  sectionTitle("Điểm hồ sơ");
  plainText(`Điểm tổng: ${formatScore10(insight.overallScore)}/10 — ${CLASSIFICATION_LABELS[insight.classification]}`, { bold: true });
  y += 1;
  bullet(insight.overallComment);

  const rankedIds = insight.criteria
    .filter((c) => (c.id === "academic" || c.id === "language" || c.id === "certificate") && c.status === "evaluated" && c.impactScore != null)
    .sort((a, b) => (b.impactScore as number) - (a.impactScore as number))
    .map((c) => c.id);

  if (rankedIds.length > 0) {
    y += 2;
    plainText("Ưu tiên cải thiện:", { bold: true });
    rankedIds.forEach((id, i) => {
      const c = insight.criteria.find((cr) => cr.id === id);
      bullet(`#${i + 1} ${CRITERION_LABELS[id]} — ${formatScore10(c?.score ?? 0)}/10`);
    });
  }

  // ---------- Việc cần làm tiếp theo ----------
  sectionTitle("Việc cần làm tiếp theo");
  if (insight.nextActions.length === 0) {
    bullet("Chưa có đề xuất — AI hiện không khả dụng.");
  } else {
    insight.nextActions.forEach((action) => {
      const priority = priorityLabelFor(action, rankedIds);
      bullet(`[${priority}] ${action}`);
    });
  }

  // ---------- Danh sách chương trình phù hợp ----------
  sectionTitle(`Danh sách chương trình phù hợp (${schools.length})`);
  if (schools.length === 0) {
    bullet("Chưa có chương trình phù hợp trong catalog.");
  } else {
    schools.forEach((s, i) => {
      ensureSpace(18);
      if (i > 0) y += 3;
      plainText(`${i + 1}. ${s.university} — ${s.program}`, { bold: true, size: 11.5 });
      bullet(`Điểm phù hợp: ${s.matchScore}/100 — ${MATCH_LEVEL_LABELS[s.matchLevel]} (${s.verdictLine})`);
      bullet(`Học phí + sinh hoạt phí ước tính: ${formatEur(s.budgetSuggestion.totalEstimatedPerYearEur)}/năm`);
      s.summary.forEach((line) => bullet(line, { size: 9.5 }));
      link(s.officialUrl);
    });
  }

  doc.save("march-ket-qua-tu-van.pdf");
}
