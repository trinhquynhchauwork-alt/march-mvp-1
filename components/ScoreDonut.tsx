// Overall Score dạng ring/donut (mục 5.14, v4.1 — thay banner chữ nhật lớn, AC-UX12).
// Flat brand.primary, KHÔNG dùng gradient trên khối chính (Hard Rule, mục 3.6.5).
export default function ScoreDonut({
  score,
  size = 96,
  strokeWidth = 9,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--momo-brand-primary-tonal)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--momo-brand-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-headline-l-bold" style={{ color: "var(--momo-text-default)" }}>
          {Math.round(clamped)}
        </span>
        <span className="text-description-xs-regular" style={{ color: "var(--momo-text-hint)" }}>
          /100
        </span>
      </div>
    </div>
  );
}
