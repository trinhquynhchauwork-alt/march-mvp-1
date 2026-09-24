"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageHead from "@/components/layout/PageHead";
import ScoreBadge from "@/components/ScoreBadge";
import ScoreDonut from "@/components/ScoreDonut";
import CriterionCard from "@/components/insight/CriterionCard";
import PriorityCriteriaList from "@/components/insight/PriorityCriteriaList";
import { loadProfile, loadInsightIfMatches, saveInsight } from "@/lib/clientStorage";
import type { InsightResult } from "@/types/domain";

const AI_CRITERION_IDS = new Set(["experience", "research", "leadership", "major_fit"]);

export default function InsightPage() {
  const router = useRouter();
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(true);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) {
      router.replace("/");
      return;
    }

    const cached = loadInsightIfMatches(profile);
    if (cached) {
      // Defer past the effect's synchronous pass (react-hooks/set-state-in-effect).
      queueMicrotask(() => {
        setInsight(cached);
        setLoading(false);
      });
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/profile/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          setError(data.error ?? "Không tính được Insight. Vui lòng quay lại chỉnh Profile.");
          setLoading(false);
          return;
        }

        saveInsight(profile, data.insight);
        setInsight(data.insight);
        setLoading(false);
      } catch {
        setError("Có lỗi khi kết nối server. Vui lòng thử lại.");
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <AppShell>
        <PageHead title="Đánh giá hồ sơ" description="Dựa trên chấm điểm theo quy tắc và đánh giá bổ sung từ AI." />
        <p style={{ color: "var(--momo-text-secondary)" }}>Đang phân tích hồ sơ...</p>
      </AppShell>
    );
  }

  if (error || !insight) {
    return (
      <AppShell>
        <PageHead title="Đánh giá hồ sơ" description="Dựa trên chấm điểm theo quy tắc và đánh giá bổ sung từ AI." />
        <p style={{ color: "var(--momo-error)" }}>{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-md px-4 py-2 text-body-default-regular"
          style={{ border: "1px solid var(--momo-border-default)", color: "var(--momo-text-default)" }}
        >
          Quay lại chỉnh hồ sơ
        </button>
      </AppShell>
    );
  }

  const totalCriteria = insight.criteria.length;
  const aiCriteria = insight.criteria.filter((c) => AI_CRITERION_IDS.has(c.id));

  return (
    <AppShell>
      <PageHead
        title="Đánh giá hồ sơ"
        description="Dựa trên chấm điểm theo quy tắc và đánh giá bổ sung từ AI."
        meta="7 tiêu chí + điểm tổng"
      />

      {/* Score section — full width phía trên 2-col (mục 5.14, ring thay banner chữ nhật) */}
      <div
        className="mb-6 flex flex-col items-center gap-5 rounded-2xl p-6 sm:flex-row sm:items-center"
        style={{ background: "var(--momo-bg-default)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <ScoreDonut score={insight.overallScore} />
        <div className="text-center sm:text-left">
          <ScoreBadge label={insight.classification} />
          {insight.evaluatedCount < totalCriteria && (
            <p className="mt-1 text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
              Điểm tổng được tính trên {insight.evaluatedCount}/{totalCriteria} tiêu chí.
            </p>
          )}
          <p className="mt-2 text-body-default-regular" style={{ color: "var(--momo-text-default)" }}>
            {insight.overallComment}
          </p>
        </div>
      </div>

      {/* Bố cục 1 cột (mục 5.14) — "Việc cần làm tiếp theo" đã dời sang P3, đặt sau danh sách
          trường (theo yêu cầu user 24/09), nên P2 không còn cột phải sticky riêng nữa. */}
      <div className="space-y-4">
        {/* Khối 1 — Ưu tiên cải thiện (mục 5.14) */}
        <PriorityCriteriaList criteria={insight.criteria} />

        {/* Khối 2 — Nhận xét bổ sung từ AI, mở sẵn mặc định (theo yêu cầu user 24/09 — trước
            đây thu gọn mặc định), user bấm mũi tên hoặc summary để tự thu gọn lại. */}
        <details
          open={aiOpen}
          onToggle={(e) => setAiOpen(e.currentTarget.open)}
          className="rounded-xl p-4"
          style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}
        >
          <summary className="cursor-pointer list-none text-body-default-regular" style={{ color: "var(--momo-brand-primary)", fontWeight: 600 }}>
            {aiOpen ? "Ẩn nhận xét bổ sung từ AI ▴" : "Xem nhận xét bổ sung từ AI ▾"}
          </summary>
          <p className="mt-2 text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
            Các tiêu chí dưới đây do AI đánh giá để bổ sung ngữ cảnh, không tính vào Điểm tổng.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {aiCriteria.map((c) => (
              <CriterionCard key={c.id} criterion={c} />
            ))}
          </div>
        </details>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push("/")}
            className="rounded-md px-4 py-2 text-body-default-regular"
            style={{ border: "1px solid var(--momo-border-default)", color: "var(--momo-text-default)" }}
          >
            Chỉnh hồ sơ
          </button>
          <button
            onClick={() => router.push("/schools")}
            className="flex-1 rounded-lg px-5 py-2.5 text-action-default-bold"
            style={{ background: "var(--momo-brand-primary)", color: "#ffffff", boxShadow: "0 4px 16px rgba(235,47,150,0.24)" }}
          >
            Xem trường phù hợp →
          </button>
        </div>
      </div>
    </AppShell>
  );
}
