const COLORS: Record<string, string> = {
  Excellent: "bg-pink-50 text-pink-700 border-pink-200",
  Good: "bg-violet-50 text-violet-700 border-violet-200",
  Average: "bg-amber-50 text-amber-700 border-amber-200",
  "Need Improvement": "bg-red-50 text-red-700 border-red-200",
};

export default function ScoreBadge({ label }: { label: string }) {
  const cls = COLORS[label] ?? "bg-gray-100 text-gray-800 border-gray-300";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
