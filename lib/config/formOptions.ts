export const CURRENT_EDUCATION_OPTIONS = [
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
  "Chưa tốt nghiệp ĐH",
  "Đã tốt nghiệp ĐH",
] as const;

export const TARGET_DEGREE_OPTIONS = ["Bachelor", "Master"] as const;

export const ENGLISH_CERT_TYPES = ["IELTS", "TOEFL"] as const;
export const GERMAN_CERT_TYPES = ["Goethe", "TestDaF", "DSH", "telc"] as const;
export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const TESTDAF_LEVELS = ["TDN 3", "TDN 4", "TDN 5"] as const;
export const DSH_LEVELS = ["DSH-1", "DSH-2", "DSH-3"] as const;

// German cert type -> danh sách level tương ứng (Goethe/telc dùng thẳng CEFR; TestDaF/DSH
// dùng thang gốc riêng, backend quy đổi sang CEFR khi tính điểm — spec v2 mục 5.4.2).
export const GERMAN_LEVELS_BY_TYPE: Record<(typeof GERMAN_CERT_TYPES)[number], readonly string[]> = {
  Goethe: CEFR_LEVELS,
  telc: CEFR_LEVELS,
  TestDaF: TESTDAF_LEVELS,
  DSH: DSH_LEVELS,
};

export const MAJOR_OPTIONS = [
  "Computer Science",
  "Data Science / AI",
  "Business & Management",
  "Economics",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
] as const;
