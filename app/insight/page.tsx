"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ScoreBadge from "@/components/ScoreBadge";
import ScoreDonut from "@/components/ScoreDonut";
import CriterionCard from "@/components/insight/CriterionCard";
import { loadProfile, loadInsightIfMatches, saveInsight } from "@/lib/clientStorage";
import type { InsightResult } from "@/types/domain";

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
      <AppShell title="AI Profile Insight — Điểm hồ sơ">
        <p className="text-gray-600">Đang phân tích hồ sơ...</p>
      </AppShell>
    );
  }

  if (error || !insight) {
    return (
      <AppShell title="AI Profile Insight — Điểm hồ sơ">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Quay lại chỉnh Profile
        </button>
      </AppShell>
    );
  }

  const totalCriteria = insight.criteria.length;

  return (
    <AppShell title="AI Profile Insight — Điểm hồ sơ" meta="8 tiêu chí + điểm tổng">
      <div className="flex flex-col items-center gap-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <ScoreDonut score={insight.overallScore} />
        <div className="text-center sm:text-left">
          <ScoreBadge label={insight.classification} />
          {insight.evaluatedCount < totalCriteria && (
            <p className="mt-1 text-xs text-gray-500">
              Overall Score được tính trên {insight.evaluatedCount}/{totalCriteria} tiêu chí.
            </p>
          )}
          <p className="mt-2 text-sm text-gray-700">{insight.overallComment}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {insight.criteria.map((c) => (
          <CriterionCard key={c.id} criterion={c} />
        ))}
      </div>

      {insight.nextActions.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Next Actions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {insight.nextActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.push("/")}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Chỉnh Profile
        </button>
        <button
          onClick={() => router.push("/schools")}
          className="flex-1 rounded-md bg-gradient-to-r from-pink-500 to-fuchsia-500 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Tìm trường phù hợp
        </button>
      </div>
    </AppShell>
  );
}
