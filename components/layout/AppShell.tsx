"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Chỉ 3 bước — Action Plan/Checklist (bước 4) nằm ngoài phạm vi MVP (mục 1.3).
// Nhãn ngắn dùng cho pill nav trên header (mục 3.6.4 — Header variant white, sticky top,
// đúng bố cục march-mvp-demo-desktop.html); tiêu đề đầy đủ hiển thị riêng ở page-head từng trang.
const STEPS = [
  { href: "/", label: "Hồ sơ", step: 1 },
  { href: "/insight", label: "Đánh giá", step: 2 },
  { href: "/schools", label: "Trường học", step: 3 },
] as const;

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeStep = STEPS.find((s) => s.href === pathname)?.step ?? 1;

  return (
    <div className="min-h-screen">
      {/* App header — sticky top, variant white (mục 3.6.4/3.6.5), thay cho sidebar trái */}
      <header
        className="sticky top-0 z-20"
        style={{ background: "var(--momo-bg-default)", borderBottom: "1px solid var(--momo-border-default)" }}
      >
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-6">
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-header-default-bold"
              style={{ background: "var(--momo-brand-primary)", color: "#ffffff" }}
            >
              M
            </span>
            <span className="text-header-s-semibold" style={{ color: "var(--momo-text-default)" }}>
              March
            </span>
          </div>

          <nav className="flex gap-1 rounded-full p-1" style={{ background: "var(--momo-bg-surface)" }}>
            {STEPS.map((s) => {
              const isActive = s.step === activeStep;
              const isDone = s.step < activeStep;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-label-default-medium transition-colors sm:px-5"
                  style={{
                    background: isActive ? "var(--momo-brand-primary)" : "transparent",
                    color: isActive ? "#ffffff" : "var(--momo-text-secondary)",
                  }}
                >
                  <span
                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.3)" : isDone ? "var(--momo-interactive)" : "var(--momo-border-default)",
                      color: "#ffffff",
                    }}
                  >
                    {s.step}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="w-8 shrink-0" />
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-6 py-10">{children}</main>
    </div>
  );
}
