"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import SchoolCard from "@/components/schools/SchoolCard";
import { loadProfile, loadInsightIfMatches, loadSchoolsIfMatches, saveSchools } from "@/lib/clientStorage";
import type { MatchedProgram, Profile } from "@/types/domain";

export default function SchoolsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schools, setSchools] = useState<MatchedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Major Fit (mục 6.6.2) nguồn AI Evaluation — dùng lại điểm đã tính ở Insight (giờ là
  // field top-level InsightResult.majorFitScore, mục 7.2), không gọi thêm AI (P3 "không
  // tính lại điểm hồ sơ", mục 1.5).
  const search = useCallback(async (p: Profile) => {
    setLoading(true);
    setMessage(null);
    try {
      const insight = loadInsightIfMatches(p);
      const majorFitScore = insight?.majorFitScore ?? null;

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
    queueMicrotask(() => setProfile(p));
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

  return (
    <AppShell
      title="Danh sách trường phù hợp"
      meta={schools.length > 0 ? `${schools.length} chương trình · sắp xếp theo điểm phù hợp` : undefined}
    >
      <p className="text-body-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
        Danh sách chương trình đại học Đức phù hợp với hồ sơ, sắp xếp theo Điểm phù hợp.
      </p>

      {loading && (
        <p className="mt-6 text-body-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
          Đang tìm chương trình phù hợp...
        </p>
      )}

      {!loading && message && schools.length === 0 && (
        <div className="mt-6 rounded-xl p-4 text-body-default-regular" style={{ background: "var(--momo-warning-container)", color: "var(--momo-warning)" }}>
          {message}
        </div>
      )}

      {!loading && schools.length > 0 && (
        <div className="mt-6 space-y-3">
          {schools.map((s) => (
            <SchoolCard key={s.programId} school={s} />
          ))}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => router.push("/")}
          className="rounded-md px-4 py-2 text-body-default-regular"
          style={{ border: "1px solid var(--momo-border-default)", color: "var(--momo-text-default)" }}
        >
          Chỉnh hồ sơ
        </button>
        <button
          onClick={() => profile && search(profile)}
          disabled={loading || !profile}
          className="flex-1 rounded-md py-2.5 text-action-default-bold disabled:opacity-50"
          style={{ background: "var(--momo-brand-primary)", color: "#ffffff" }}
        >
          Tìm lại
        </button>
      </div>
    </AppShell>
  );
}
