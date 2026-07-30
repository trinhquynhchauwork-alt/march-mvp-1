import type { MatchedSchool } from "@/types/domain";
import ScoreBadge from "@/components/ScoreBadge";

const AVATAR_COLORS = [
  "bg-pink-100 text-pink-700",
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
];

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length >= 2 ? [words[0][0], words[1][0]] : [name.slice(0, 2)];
  return letters.join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string): string {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function SchoolCard({ school }: { school: MatchedSchool }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarColor(
              school.university
            )}`}
          >
            {initials(school.university)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-medium text-gray-900">{school.university}</h3>
            <p className="text-sm text-gray-600">{school.program}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-2xl font-bold text-gray-900">{school.matchScore}</span>
          <ScoreBadge label={school.matchLevel} />
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-gray-700">
        {school.summary.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      <a
        href={school.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-medium text-pink-600 hover:underline"
      >
        Xem trang chính thức ↗
      </a>
    </div>
  );
}
