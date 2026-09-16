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

// Budget Suggestion pill — MoMo Chip (pill radius 999px), góc trên-phải, cùng vị trí trên
// mọi card (mục 6.8.5/AC9).
function BudgetPill({ school }: { school: MatchedProgram }) {
  const { budgetSuggestion } = school;
  if (budgetSuggestion.totalEstimatedPerYearEur == null) {
    return (
      <div className="rounded-full px-2.5 py-1.5 text-right text-description-xs-regular shadow" style={{ background: "rgba(255,255,255,0.95)", color: "var(--momo-text-secondary)" }}>
        Chưa có thông tin học phí
      </div>
    );
  }

  return (
    <details className="group">
      <summary className="cursor-pointer list-none rounded-full px-2.5 py-1.5 text-right shadow" style={{ background: "var(--momo-bg-tonal)" }}>
        <div className="tabular-nums text-body-default-regular" style={{ color: "var(--momo-text-default)", fontWeight: 700 }}>
          ~ {formatEur(budgetSuggestion.totalEstimatedPerYearEur)} EUR/năm
        </div>
        <div className="text-description-xs-regular" style={{ color: "var(--momo-brand-primary)" }}>
          ước tính · Non-EU
        </div>
      </summary>
      <div className="absolute right-3 z-10 mt-1 w-56 rounded-lg p-3 text-left text-description-default-regular shadow-lg" style={{ background: "var(--momo-bg-default)", color: "var(--momo-text-secondary)" }}>
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
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 9 12 4l10 5-10 5-10-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function SchoolCard({ school }: { school: MatchedProgram }) {
  const matchToken = STATUS_TOKENS[school.matchLevel];
  const tierLabel = school.rankingTier !== "unknown" ? RANKING_TIER_LABELS[school.rankingTier] : null;

  return (
    <div className="overflow-hidden rounded-xl" style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      {/* Image banner (mục 6.10.1) + Logo góc trên-trái + Budget pill góc trên-phải (AC9/AC10) */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={school.image.imageUrl} alt="" className="h-28 w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={school.logo.logoUrl}
          alt={`Logo ${school.university}`}
          className="absolute left-3 top-3 h-11 w-11 rounded-lg border-2 object-cover shadow"
          style={{ borderColor: "var(--momo-bg-default)" }}
        />
        <div className="absolute right-3 top-3">
          <BudgetPill school={school} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-header-default-bold" style={{ color: "var(--momo-text-default)" }}>
                {school.university}
              </h3>
              {tierLabel && (
                <span
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-description-xs-regular"
                  style={{ background: "var(--momo-bg-surface)", color: "var(--momo-text-secondary)" }}
                >
                  {tierLabel}
                </span>
              )}
            </div>
            <p className="text-body-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
              {school.program}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-headline-l-bold" style={{ color: "var(--momo-text-default)" }}>
              {school.matchScore}
            </span>
            <ScoreBadge label={school.matchLevel} />
          </div>
        </div>

        {/* Verdict Line (mục 6.7.1, v4.1) — text-only, không tô nền */}
        <p className="mt-1 text-body-default-regular" style={{ color: matchToken?.color ?? "var(--momo-text-secondary)", fontWeight: 500 }}>
          {school.verdictLine}
        </p>

        {/* Scholarship badge (mục 6.9.6) */}
        {school.scholarships.length > 0 && (
          <details className="mt-2">
            <summary
              className="inline-flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-s-medium"
              style={{ border: "1px solid var(--momo-brand-primary-tonal)", background: "var(--momo-bg-tonal)", color: "var(--momo-brand-primary)" }}
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

        <ul className="mt-3 space-y-1 text-body-default-regular" style={{ color: "var(--momo-text-default)" }}>
          {school.summary.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        <details className="mt-2">
          <summary className="cursor-pointer list-none text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
            Vì sao có điểm phù hợp này?
          </summary>
          <p className="mt-1 whitespace-pre-line text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
            {school.matchLevelExplanation}
          </p>
        </details>

        <div className="mt-3 flex items-center justify-between">
          <a href={school.officialUrl} target="_blank" rel="noopener noreferrer" className="text-body-default-regular" style={{ color: "var(--momo-brand-primary)", fontWeight: 500 }}>
            Xem trang chính thức ↗
          </a>
          <span className="text-description-xs-regular" style={{ color: "var(--momo-text-hint)" }}>
            Cập nhật: {formatDate(school.lastVerifiedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
