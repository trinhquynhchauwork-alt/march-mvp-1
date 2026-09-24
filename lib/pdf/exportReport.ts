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

const COLOR_PRIMARY: [number, number, number] = [235, 47, 150];
const COLOR_TEXT: [number, number, number] = [48, 50, 51];
const COLOR_SECONDARY: [number, number, number] = [114, 114, 114];
const COLOR_HINT: [number, number, number] = [153, 153, 153];

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
  let y = 20;

  function ensureSpace(next: number) {
    if (y + next > bottomLimit) {
      doc.addPage();
      y = 20;
    }
  }

  function heading(text: string, size = 13) {
    ensureSpace(size * 0.6 + 4);
    doc.setFont("Roboto", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...COLOR_PRIMARY);
    doc.text(text, marginX, y);
    y += size * 0.55 + 2;
  }

  function paragraph(text: string, opts?: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number }) {
    const size = opts?.size ?? 10.5;
    const indent = opts?.indent ?? 0;
    doc.setFont("Roboto", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts?.color ?? COLOR_TEXT));
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    for (const line of lines) {
      ensureSpace(size * 0.5);
      doc.text(line, marginX + indent, y);
      y += size * 0.5;
    }
  }

  function divider() {
    ensureSpace(4);
    doc.setDrawColor(230, 230, 230);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 5;
  }

  // ---------- Title ----------
  doc.setFont("Roboto", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text("March — Kết quả tư vấn du học", marginX, y);
  y += 8;
  paragraph(`Xuất ngày ${new Date().toLocaleDateString("vi-VN")}`, { size: 9, color: COLOR_HINT });
  y += 2;

  // ---------- Điểm hồ sơ ----------
  heading("Điểm hồ sơ");
  paragraph(`Điểm tổng: ${formatScore10(insight.overallScore)}/10 — ${CLASSIFICATION_LABELS[insight.classification]}`, { bold: true });
  paragraph(insight.overallComment, { color: COLOR_SECONDARY });
  y += 2;

  const rankedIds = insight.criteria
    .filter((c) => (c.id === "academic" || c.id === "language" || c.id === "certificate") && c.status === "evaluated" && c.impactScore != null)
    .sort((a, b) => (b.impactScore as number) - (a.impactScore as number))
    .map((c) => c.id);

  if (rankedIds.length > 0) {
    paragraph("Ưu tiên cải thiện:", { bold: true });
    rankedIds.forEach((id, i) => {
      const c = insight.criteria.find((cr) => cr.id === id);
      paragraph(`#${i + 1} ${CRITERION_LABELS[id]} — ${formatScore10(c?.score ?? 0)}/10`, { indent: 4, color: COLOR_SECONDARY });
    });
    y += 2;
  }

  // ---------- Việc cần làm tiếp theo ----------
  divider();
  heading("Việc cần làm tiếp theo");
  if (insight.nextActions.length === 0) {
    paragraph("Chưa có đề xuất — AI hiện không khả dụng.", { color: COLOR_HINT });
  } else {
    insight.nextActions.forEach((action) => {
      const priority = priorityLabelFor(action, rankedIds);
      paragraph(`[${priority}] ${action}`, { indent: 2 });
    });
  }
  y += 2;

  // ---------- Danh sách chương trình phù hợp ----------
  divider();
  heading(`Danh sách chương trình phù hợp (${schools.length})`);
  if (schools.length === 0) {
    paragraph("Chưa có chương trình phù hợp trong catalog.", { color: COLOR_HINT });
  } else {
    schools.forEach((s, i) => {
      ensureSpace(16);
      paragraph(`${i + 1}. ${s.university} — ${s.program}`, { bold: true, size: 11 });
      paragraph(`Điểm phù hợp: ${s.matchScore}/100 — ${MATCH_LEVEL_LABELS[s.matchLevel]} (${s.verdictLine})`, { indent: 4, color: COLOR_SECONDARY });
      paragraph(`Học phí + sinh hoạt phí ước tính: ${formatEur(s.budgetSuggestion.totalEstimatedPerYearEur)}/năm`, { indent: 4, color: COLOR_SECONDARY });
      s.summary.forEach((line) => paragraph(line, { indent: 4, size: 9.5, color: COLOR_SECONDARY }));
      paragraph(s.officialUrl, { indent: 4, size: 9, color: COLOR_PRIMARY });
      y += 3;
    });
  }

  doc.save("march-ket-qua-tu-van.pdf");
}
