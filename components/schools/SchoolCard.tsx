"use client";

import { useEffect, useState } from "react";
import type { MatchedProgram } from "@/types/domain";
import ScoreBadge from "@/components/ScoreBadge";
import { STATUS_TOKENS } from "@/lib/config/statusColors";
import { RANKING_TIER_LABELS } from "@/lib/config/enumLabels";

function formatEur(value: number | null): string {
  return value != null ? value.toLocaleString("de-DE") : "—";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return iso;
  }
}

// Budget Suggestion — MoMo Chip (pill/box radius, nền tonal), đặt trong cột phải (mục
// 6.8.5), đúng march-mvp-demo-desktop.html (`.budget-block` nằm trong `.card-side`, KHÔNG
// overlay lên banner).
function BudgetBlock({ school }: { school: MatchedProgram }) {
  const { budgetSuggestion } = school;
  if (budgetSuggestion.totalEstimatedPerYearEur == null) {
    return (
      <div className="mt-3.5 rounded-lg p-2.5 text-description-xs-regular" style={{ background: "var(--momo-bg-surface)", color: "var(--momo-text-secondary)" }}>
        Chưa có thông tin học phí
      </div>
    );
  }

  return (
    <details className="group mt-3.5">
      <summary className="cursor-pointer list-none rounded-lg p-2.5" style={{ background: "var(--momo-bg-tonal)" }}>
        <div className="tabular-nums text-body-default-regular" style={{ color: "var(--momo-text-default)", fontWeight: 700 }}>
          ~ {formatEur(budgetSuggestion.totalEstimatedPerYearEur)} EUR/năm
        </div>
        <div className="text-description-xs-regular" style={{ color: "var(--momo-text-secondary)" }}>
          ước tính · Non-EU
        </div>
      </summary>
      <div className="mt-1.5 rounded-lg p-2.5 text-description-default-regular" style={{ background: "var(--momo-bg-surface)", color: "var(--momo-text-secondary)" }}>
        <p>Học phí: {formatEur(budgetSuggestion.tuitionFeePerYearEur)} EUR/năm</p>
        <p>Sinh hoạt phí: {formatEur(budgetSuggestion.livingCostPerYearEur)} EUR/năm</p>
        <p className="mt-1">{budgetSuggestion.note}</p>
      </div>
    </details>
  );
}

// Icon học bổng SVG — KHÔNG dùng emoji 🎓 (Hard Rule mục 3.6.5).
function ScholarshipIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ marginRight: 2 }}>
      <path d="M1 5L7 2L13 5L7 8L1 5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

// Card layout (mục 6.10) — 3 cột trên desktop (thumb 200px | main | side ~220px), xếp dọc
// trên mobile, banner bấm để zoom full-size (theo yêu cầu user).
export default function SchoolCard({ school }: { school: MatchedProgram }) {
  const matchToken = STATUS_TOKENS[school.matchLevel];
  const tierLabel = school.rankingTier !== "unknown" ? RANKING_TIER_LABELS[school.rankingTier] : null;
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomed]);

  return (
    <div
      className="grid grid-cols-1 overflow-hidden rounded-xl sm:grid-cols-[200px_1fr_220px]"
      style={{ background: "var(--momo-bg-default)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Thumb — banner (bấm để xem full-size) + logo góc dưới-trái (mục 6.10) */}
      <div className="relative h-52 sm:h-auto sm:min-h-[230px]">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="block h-full w-full cursor-zoom-in"
          aria-label={`Xem ảnh lớn ${school.university}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={school.image.imageUrl} alt="" className="h-full w-full object-cover" />
        </button>
        <div
          className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg shadow"
          style={{ background: "var(--momo-bg-default)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={school.logo.logoUrl} alt={`Logo ${school.university}`} className="h-full w-full object-contain" />
        </div>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setZoomed(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={school.image.imageUrl}
            alt={school.university}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Đóng"
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-lg"
            style={{ background: "var(--momo-bg-default)", color: "var(--momo-text-default)" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main — tên trường/chương trình, summary, giải thích (mục 6.7) */}
      <div className="min-w-0 border-b p-5 sm:border-b-0 sm:border-r" style={{ borderColor: "var(--momo-border-default)" }}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
            {school.university}
          </span>
          {tierLabel && (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-description-xs-regular"
              style={{ background: "var(--momo-bg-surface)", color: "var(--momo-text-secondary)" }}
            >
              {tierLabel}
            </span>
          )}
        </div>
        <h3 className="mt-0.5 text-header-default-bold" style={{ color: "var(--momo-text-default)" }}>
          {school.program}
        </h3>

        <ul className="mt-3 space-y-1 text-body-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
          {school.summary.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        <details className="mt-2.5">
          <summary className="cursor-pointer list-none text-description-default-regular" style={{ color: "var(--momo-brand-primary)", fontWeight: 500 }}>
            Xem chi tiết cách tính ▾
          </summary>
          <p className="mt-1 whitespace-pre-line text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
            {school.matchLevelExplanation}
          </p>
        </details>
      </div>

      {/* Side — điểm phù hợp, budget, học bổng, link chính thức (mục 6.8.5/6.9.6) */}
      <div className="flex flex-col justify-between p-5">
        <div>
          <div className="text-right">
            <div className="text-headline-l-bold" style={{ color: "var(--momo-brand-primary)" }}>
              {school.matchScore}
            </div>
            <p className="mt-0.5 text-right text-description-default-regular" style={{ color: matchToken?.color ?? "var(--momo-text-secondary)", fontWeight: 600 }}>
              {school.verdictLine}
            </p>
            <div className="mt-1 flex justify-end">
              <ScoreBadge label={school.matchLevel} />
            </div>
          </div>
          <BudgetBlock school={school} />
        </div>

        <div className="mt-4">
          {school.scholarships.length > 0 && (
            <details>
              <summary
                className="inline-flex w-fit cursor-pointer list-none items-center gap-1 rounded-full px-2.5 py-0.5 text-label-s-medium"
                style={{ background: "var(--momo-bg-tonal)", color: "var(--momo-brand-primary)" }}
              >
                <ScholarshipIcon /> Có học bổng
              </summary>
              <ul className="mt-2 space-y-1.5 rounded-lg p-3 text-body-default-regular" style={{ background: "var(--momo-bg-surface)" }}>
                {school.scholarships.map((s, i) => (
                  <li key={i}>
                    <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--momo-brand-primary)", fontWeight: 500 }}>
                      {s.name}
                    </a>{" "}
                    <span style={{ color: "var(--momo-text-secondary)" }}>
                      ({s.level === "government" ? "Chính phủ" : s.level === "state" ? "Bang" : "Trường"})
                    </span>
                    {s.note && <p style={{ color: "var(--momo-text-secondary)" }}>{s.note}</p>}
                  </li>
                ))}
              </ul>
            </details>
          )}
          <a
            href={school.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-body-default-regular"
            style={{ color: "var(--momo-brand-primary)", fontWeight: 600 }}
          >
            Xem trang chính thức →
          </a>
          <div className="mt-1.5 text-description-xs-regular" style={{ color: "var(--momo-text-hint)" }}>
            Xác minh gần nhất: {formatDate(school.lastVerifiedAt)}
          </div>
        </div>
      </div>
    </div>
  );
}
