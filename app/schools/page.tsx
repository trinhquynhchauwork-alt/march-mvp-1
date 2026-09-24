"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageHead from "@/components/layout/PageHead";
import SchoolCard from "@/components/schools/SchoolCard";
import NextActionsChecklist from "@/components/insight/NextActionsChecklist";
import { loadProfile, loadInsightIfMatches, loadSchoolsIfMatches, saveSchools } from "@/lib/clientStorage";
import type { InsightResult, MatchedProgram, Profile } from "@/types/domain";

export default function SchoolsPage() {
  const router = useRouter();
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [schools, setSchools] = useState<MatchedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Major Fit (mục 6.6.2) nguồn AI Evaluation — dùng lại điểm đã tính ở Insight (giờ là
  // field top-level InsightResult.majorFitScore, mục 7.2), không gọi thêm AI (P3 "không
  // tính lại điểm hồ sơ", mục 1.5).
  const search = useCallback(async (p: Profile) => {
    setLoading(true);
    setMessage(null);
    try {
      const cachedInsight = loadInsightIfMatches(p);
      setInsight(cachedInsight);
      const majorFitScore = cachedInsight?.majorFitScore ?? null;

      const res = await fetch("/api/schools/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p, majorFitScore }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "Không tìm thấy chương trình phù hợp.");
        setSchools([]);
        setLoading(false);
        return;
      }

      saveSchools(p, data.schools);
      setSchools(data.schools);
      setMessage(data.message ?? null);
      setLoading(false);
    } catch {
      setMessage("Có lỗi khi kết nối server. Vui lòng thử lại.");
      setSchools([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/");
      return;
    }
    const cached = loadSchoolsIfMatches(p);
    // Defer past the effect's synchronous pass (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      setInsight(loadInsightIfMatches(p));
    });
    if (cached) {
      queueMicrotask(() => {
        setSchools(cached);
        setMessage(cached.length === 0 ? "Không tìm thấy chương trình phù hợp." : null);
        setLoading(false);
      });
      return;
    }

    queueMicrotask(() => search(p));
  }, [router, search]);

  async function handleDownload() {
    if (!insight || downloading) return;
    setDownloading(true);
    try {
      const { downloadReportPdf } = await import("@/lib/pdf/exportReport");
      await downloadReportPdf(insight, schools);
    } catch (err) {
      console.error("[schools] export PDF error:", err);
      setMessage("Không tạo được file PDF. Vui lòng thử lại.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppShell>
      <PageHead
        title="Chương trình phù hợp"
        description="Kết quả từ kho dữ liệu trường — sắp xếp theo mức độ phù hợp."
        meta={schools.length > 0 ? `${schools.length} chương trình · sắp xếp theo điểm phù hợp` : undefined}
      />

      {!loading && schools.length > 1 && (
        <div
          className="mb-5 flex items-start gap-2.5 rounded-xl p-3.5 text-body-default-regular"
          style={{ background: "var(--momo-bg-tonal)", color: "#8a1c60" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0">
            <circle cx="7" cy="7" r="6.25" stroke="#8a1c60" strokeWidth="1.3" />
            <path d="M7 6.2V10.2" stroke="#8a1c60" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="7" cy="4.1" r="0.9" fill="#8a1c60" />
          </svg>
          <span>
            Các chương trình dưới đây có thể cùng ngành nhưng mức độ phù hợp khác nhau — vì mỗi trường có ngưỡng đầu vào riêng.
          </span>
        </div>
      )}

      {loading && (
        <p className="text-body-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
          Đang tìm chương trình phù hợp...
        </p>
      )}

      {!loading && message && schools.length === 0 && (
        <div className="rounded-xl p-4 text-body-default-regular" style={{ background: "var(--momo-warning-container)", color: "var(--momo-warning)" }}>
          {message}
        </div>
      )}

      {!loading && schools.length > 0 && (
        <div className="space-y-4">
          {schools.map((s) => (
            <SchoolCard key={s.programId} school={s} />
          ))}
        </div>
      )}

      {/* Việc cần làm tiếp theo (mục 5.15) — dời từ P2 sang đây, đặt sau danh sách trường
          (theo yêu cầu user 24/09), tải xuống chung 1 file PDF với danh sách trường ở trên. */}
      {!loading && insight && (
        <div className="mt-6">
          <NextActionsChecklist nextActions={insight.nextActions} priorityCriteria={insight.criteria} />
        </div>
      )}

      {/* 2 CTA cuối trang (theo yêu cầu user 24/09) — Quay lại (phụ) + Tải xuống (chính,
          primary), thay cho bộ 3 nút Chỉnh hồ sơ/Tìm lại/Tải xuống trước đó. */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => router.push("/")}
          className="rounded-md px-4 py-2 text-body-default-regular"
          style={{ border: "1px solid var(--momo-border-default)", color: "var(--momo-text-default)" }}
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!insight || downloading}
          className="flex-1 rounded-lg py-2.5 text-action-default-bold disabled:opacity-50"
          style={{ background: "var(--momo-brand-primary)", color: "#ffffff", boxShadow: "0 4px 16px rgba(235,47,150,0.24)" }}
        >
          {downloading ? "Đang tạo file..." : "Tải xuống (PDF)"}
        </button>
      </div>
    </AppShell>
  );
}
