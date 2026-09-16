"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Chỉ 3 bước — Action Plan/Checklist (bước 4) nằm ngoài phạm vi MVP (mục 1.3).
const STEPS = [
  { href: "/", label: "Nhập hồ sơ", step: 1 },
  { href: "/insight", label: "Điểm hồ sơ (7 tiêu chí)", step: 2 },
  { href: "/schools", label: "Danh sách trường phù hợp", step: 3 },
] as const;

export default function AppShell({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const activeStep = STEPS.find((s) => s.href === pathname)?.step ?? 1;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 px-4 py-8">
      <aside
        className="hidden w-64 shrink-0 rounded-2xl p-4 sm:block"
        style={{ background: "var(--momo-bg-default)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <div className="mb-4 px-2 text-header-xs-semibold uppercase tracking-wide" style={{ color: "var(--momo-text-hint)" }}>
          March · Phiên tư vấn
        </div>
        <nav className="space-y-1">
          {STEPS.map((s) => {
            const isActive = s.step === activeStep;
            const isDone = s.step < activeStep;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-body-default-regular transition-colors"
                style={{
                  background: isActive ? "var(--momo-brand-primary-tonal)" : "transparent",
                  color: isActive ? "var(--momo-brand-primary)" : "var(--momo-text-secondary)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-action-xxs-bold"
                  style={{
                    background: isActive ? "var(--momo-brand-primary)" : isDone ? "var(--momo-interactive)" : "var(--momo-bg-surface)",
                    color: isActive || isDone ? "#ffffff" : "var(--momo-text-hint)",
                  }}
                >
                  {s.step}
                </span>
                {s.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section
        className="min-w-0 flex-1 overflow-hidden rounded-2xl"
        style={{ background: "var(--momo-bg-default)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        {/* MoMo Header — variant white (mục 3.6.4). Title Semibold, KHÔNG Bold (Hard Rule 3.6.5). */}
        <header
          className="flex items-center justify-between gap-3 px-6 py-4"
          style={{ background: "var(--momo-bg-default)", borderBottom: "1px solid var(--momo-border-default)" }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-action-xxs-bold"
              style={{ background: "var(--momo-brand-primary)", color: "#ffffff" }}
            >
              {activeStep}
            </span>
            <h1 className="truncate text-header-s-semibold" style={{ color: "var(--momo-text-default)" }}>
              {title}
            </h1>
          </div>
          {meta && (
            <span className="shrink-0 text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
              {meta}
            </span>
          )}
        </header>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}
