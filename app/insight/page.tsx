"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ScoreBadge from "@/components/ScoreBadge";
import ScoreDonut from "@/components/ScoreDonut";
import CriterionCard from "@/components/insight/CriterionCard";
import PriorityCriteriaList from "@/components/insight/PriorityCriteriaList";
import NextActionsChecklist from "@/components/insight/NextActionsChecklist";
import { loadProfile, loadInsightIfMatches, saveInsight } from "@/lib/clientStorage";
import type { InsightResult } from "@/types/domain";

const AI_CRITERION_IDS = new Set(["experience", "research", "leadership", "major_fit"]);

export default function InsightPage() {
  const router = useRouter();
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <AppShell title="Điểm hồ sơ">
        <p style={{ color: "var(--momo-text-secondary)" }}>Đang phân tích hồ sơ...</p>
      </AppShell>
    );
  }

  if (error || !insight) {
    return (
      <AppShell title="Điểm hồ sơ">
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
    <AppShell title="Điểm hồ sơ" meta="7 tiêu chí + điểm tổng">
      <div
        className="flex flex-col items-center gap-5 rounded-xl p-6 sm:flex-row sm:items-center"
        style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}
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

      {/* Khối 1 — Ưu tiên cải thiện (mục 5.14) */}
      <div className="mt-6">
        <PriorityCriteriaList criteria={insight.criteria} />
      </div>

      {/* Next Actions checklist + xuất file (mục 5.15) */}
      <div className="mt-6">
        <NextActionsChecklist
          nextActions={insight.nextActions}
          overallScore={insight.overallScore}
          classification={insight.classification}
          priorityCriteria={insight.criteria}
        />
      </div>

      {/* Khối 2 — Nhận xét bổ sung từ AI, thu gọn mặc định (mục 5.14) */}
      <details className="mt-6 rounded-xl p-4" style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}>
        <summary className="cursor-pointer list-none text-header-m-bold" style={{ color: "var(--momo-text-default)" }}>
          Nhận xét bổ sung từ AI
        </summary>
        <p className="mt-1 text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
          Các tiêu chí dưới đây do AI đánh giá để bổ sung ngữ cảnh, không tính vào Điểm tổng.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {aiCriteria.map((c) => (
            <CriterionCard key={c.id} criterion={c} />
          ))}
        </div>
      </details>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.push("/")}
          className="rounded-md px-4 py-2 text-body-default-regular"
          style={{ border: "1px solid var(--momo-border-default)", color: "var(--momo-text-default)" }}
        >
          Chỉnh hồ sơ
        </button>
        <button
          onClick={() => router.push("/schools")}
          className="flex-1 rounded-md py-2.5 text-action-default-bold"
          style={{ background: "var(--momo-brand-primary)", color: "#ffffff" }}
        >
          Tìm trường phù hợp
        </button>
      </div>
    </AppShell>
  );
}
