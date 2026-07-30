"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Chỉ 3 bước — Action Plan/Checklist (bước 4) nằm ngoài phạm vi MVP (mục 1.3).
const STEPS = [
  { href: "/", label: "CV Input", step: 1 },
  { href: "/insight", label: "Điểm hồ sơ (8 tiêu chí)", step: 2 },
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
      <aside className="hidden w-64 shrink-0 rounded-2xl bg-white p-4 shadow-sm sm:block">
        <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-pink-50 font-medium text-pink-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-pink-600 text-white"
                      : isDone
                        ? "bg-violet-500 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s.step}
                </span>
                {s.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm">
        <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 px-6 py-4 text-white">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs font-semibold">
              {activeStep}
            </span>
            <h1 className="truncate text-sm font-semibold sm:text-base">{title}</h1>
          </div>
          {meta && <span className="shrink-0 text-xs text-white/80">{meta}</span>}
        </header>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}
