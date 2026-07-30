function barColor(score: number): string {
  if (score >= 80) return "bg-pink-500";
  if (score >= 65) return "bg-violet-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function ProgressBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${barColor(clamped)}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
