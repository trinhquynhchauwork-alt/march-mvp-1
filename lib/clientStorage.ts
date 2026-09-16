// Truyền Profile/InsightResult giữa 3 bước (CV Input -> Insight -> School Matching)
// qua sessionStorage — không cần DB (MVP không có tài khoản/lưu lịch sử, xem mục 1.3).
// InsightResult được cache theo Profile đã sinh ra nó, để back/forward giữa các bước
// không tốn thêm AI call ngoài ngân sách 3 call/phiên (mục 12).
import type { Profile, InsightResult, MatchedProgram } from "@/types/domain";

const PROFILE_KEY = "march.profile";
const INSIGHT_KEY = "march.insight";
const INSIGHT_FOR_PROFILE_KEY = "march.insight.forProfile";
const SCHOOLS_KEY = "march.schools";
const SCHOOLS_FOR_PROFILE_KEY = "march.schools.forProfile";

export function saveProfile(profile: Profile) {
  sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): Profile | null {
  const raw = sessionStorage.getItem(PROFILE_KEY);
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export function saveInsight(profile: Profile, insight: InsightResult) {
  sessionStorage.setItem(INSIGHT_KEY, JSON.stringify(insight));
  sessionStorage.setItem(INSIGHT_FOR_PROFILE_KEY, JSON.stringify(profile));
}

export function loadInsightIfMatches(profile: Profile): InsightResult | null {
  const cachedProfileRaw = sessionStorage.getItem(INSIGHT_FOR_PROFILE_KEY);
  if (cachedProfileRaw !== JSON.stringify(profile)) return null;
  const raw = sessionStorage.getItem(INSIGHT_KEY);
  return raw ? (JSON.parse(raw) as InsightResult) : null;
}

export function saveSchools(profile: Profile, schools: MatchedProgram[]) {
  sessionStorage.setItem(SCHOOLS_KEY, JSON.stringify(schools));
  sessionStorage.setItem(SCHOOLS_FOR_PROFILE_KEY, JSON.stringify(profile));
}

export function loadSchoolsIfMatches(profile: Profile): MatchedProgram[] | null {
  const cachedProfileRaw = sessionStorage.getItem(SCHOOLS_FOR_PROFILE_KEY);
  if (cachedProfileRaw !== JSON.stringify(profile)) return null;
  const raw = sessionStorage.getItem(SCHOOLS_KEY);
  return raw ? (JSON.parse(raw) as MatchedProgram[]) : null;
}
