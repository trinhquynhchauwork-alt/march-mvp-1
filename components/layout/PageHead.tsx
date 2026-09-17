// Page head (mục 3.6.3 — headline_default_bold) — headline lớn + mô tả ngắn, đứng đầu mỗi
// trang P1/P2/P3, đúng bố cục march-mvp-demo-desktop.html (`.page-head`).
export default function PageHead({
  title,
  description,
  meta,
}: {
  title: string;
  description?: string;
  meta?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h1 className="text-headline-default-bold" style={{ color: "var(--momo-text-default)" }}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-body-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      {meta && (
        <span className="shrink-0 text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
          {meta}
        </span>
      )}
    </div>
  );
}
