"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import SchoolCard from "@/components/schools/SchoolCard";
import { loadProfile, loadSchoolsIfMatches, saveSchools } from "@/lib/clientStorage";
import type { MatchedSchool, Profile } from "@/types/domain";

export default function SchoolsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schools, setSchools] = useState<MatchedSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const search = useCallback(async (p: Profile) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/schools/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
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
      title="School Matching — Danh sách trường phù hợp"
      meta={schools.length > 0 ? `${schools.length} chương trình · sắp xếp theo match score` : undefined}
    >
      <p className="text-sm text-gray-600">
        Danh sách chương trình đại học Đức phù hợp với hồ sơ, sắp xếp theo Match Score.
      </p>

      {loading && <p className="mt-6 text-gray-600">Đang tìm chương trình phù hợp...</p>}

      {!loading && message && schools.length === 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {message}
        </div>
      )}

      {!loading && schools.length > 0 && (
        <div className="mt-6 space-y-3">
          {schools.map((s, i) => (
            <SchoolCard key={`${s.university}-${s.program}-${i}`} school={s} />
          ))}
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
          onClick={() => profile && search(profile)}
          disabled={loading || !profile}
          className="flex-1 rounded-md bg-gradient-to-r from-pink-500 to-fuchsia-500 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Search lại
        </button>
      </div>
    </AppShell>
  );
}
