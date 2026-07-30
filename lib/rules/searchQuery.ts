import type { Profile } from "@/types/domain";

// Backend xây dựng search query từ Profile (spec mục 6.3). AI không tự tạo search keyword.
export function buildSearchQuery(profile: Profile): string {
  const parts: string[] = [];

  parts.push(`${profile.targetDegree} ${profile.interestedMajors.join(", ")} Germany`);

  if (profile.english?.type && profile.english.score != null) {
    parts.push(`${profile.english.type} ${profile.english.score}`);
  }
  if (profile.german?.type && profile.german.level) {
    parts.push(`${profile.german.type} ${profile.german.level}`);
  }

  parts.push(`GPA ${profile.gpa.normalized.toFixed(2)}/4.0`);
  parts.push(`Budget ${profile.annualBudget.eur} EUR/year`);

  return parts.join(", ");
}
