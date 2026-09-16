// Domain types — mirrors spec v4 mục 7 (Data Model) exactly. Do not add fields not in spec.

export type TargetDegree = "Bachelor" | "Master";

export type CurrentEducation =
  | "Lớp 10"
  | "Lớp 11"
  | "Lớp 12"
  | "Chưa tốt nghiệp ĐH"
  | "Đã tốt nghiệp ĐH";

export interface Certificate {
  type: string; // IELTS | TOEFL | Goethe | TestDaF | DSH | telc | ÖSD
  score?: number; // English: numeric score (IELTS scale, TOEFL converted at rule-time)
  // German: giá trị THANG GỐC của chứng chỉ (vd "B2" cho Goethe/telc/ÖSD, "TDN 4" cho
  // TestDaF, "DSH-2" cho DSH) — backend quy đổi sang CEFR trước khi tính điểm (mục 5.4.2).
  level?: string;
}

export interface AcademicCertificate {
  name: string; // GRE, GMAT, GATE, CFA...
  score: string;
}

// annualBudget đã bị loại khỏi Profile ở v2 (mục 4.1/7.1) — chi phí giờ là output
// tham khảo ở School Matching (BudgetSuggestion), không phải input.
export interface Profile {
  currentEducation: CurrentEducation;
  targetDegree: TargetDegree;

  gpa: {
    original: number;
    scale: number;
    normalized: number; // quy về thang 4.0
  };

  english?: Certificate;
  german?: Certificate;

  academicCertificates: AcademicCertificate[];

  interestedMajors: string[]; // tối đa 3 (mục 4.4 Input Rules)

  expectedIntake?: string;
  activities?: string;

  experience?: string;
  research?: string;
}

// "financial" đã bị loại vĩnh viễn khỏi bộ tiêu chí ở v2 (mục 5.4, 6.6.1).
export type CriterionId =
  | "academic"
  | "language"
  | "certificate"
  | "experience"
  | "research"
  | "leadership"
  | "major_fit";

export interface Criterion {
  id: CriterionId;
  score?: number;
  status: "evaluated" | "not_evaluated";
  comment?: string;
  // weight/impactScore: mở rộng ngoài interface gốc mục 7.3 — CẦN THIẾT để hiển thị khối
  // "Ưu tiên cải thiện" (mục 5.14, Impact Score = Weight × (100 − Score)). Weight là
  // business rule backend-owned (lib/rules/weights.ts) — expose qua API thay vì để frontend
  // tự nhân bản bảng trọng số (giữ đúng Single Source of Truth, mục 3.2). Chỉ set cho 3 tiêu
  // chí rule-based; undefined cho tiêu chí AI (không có trọng số chính thức, mục 5.14.2).
  weight?: number;
  impactScore?: number;
}

export type Classification =
  | "Excellent"
  | "Good"
  | "Average"
  | "Need Improvement";

export interface InsightResult {
  criteria: Criterion[];
  overallScore: number;
  classification: Classification;
  overallComment: string;
  nextActions: string[];
  evaluatedCount: number; // vd 6 (trên tổng 7) — drives "Overall Score được tính trên X/7 tiêu chí"
  majorFitScore: number | null; // mục 7.2 (v4) — tái sử dụng cho Match Score ở P3 (mục 3.3/6.6.2)
}

export type MatchLevel = "Excellent Match" | "Good Match" | "Moderate Match" | "Low Match";

// --- Budget Suggestion (mục 7.5) — display-only, không ảnh hưởng Match Score ---
export interface BudgetSuggestion {
  tuitionFeePerYearEur: number | null;
  livingCostPerYearEur: number | null;
  totalEstimatedPerYearEur: number | null;
  assumption: "non-EU";
  note: string;
}

// --- Scholarship (mục 7.6) — display-only, surface thông tin công khai ---
export interface Scholarship {
  name: string;
  level: "university" | "state" | "government";
  sourceUrl: string;
  note?: string | null;
}

// --- School Logo & Image (mục 7.7) — 2 field độc lập, mục đích khác nhau ---
export interface SchoolLogo {
  logoUrl: string; // luôn có giá trị, không bao giờ null (mục 7.9) — placeholder = monogram
  logoSource: "curated" | "placeholder";
}

export interface SchoolImage {
  imageUrl: string; // luôn có giá trị, không bao giờ null (mục 7.9)
  imageSource: "curated" | "placeholder";
}

// --- School Database — Program (mục 7.8, mới ở v4) ---

export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface ProgramRequirement {
  minGpa4: number | null;
  minLanguage: {
    english?: { test: "IELTS"; minScore: number } | null;
    german?: { minCEFR: Cefr } | null;
  } | null;
  note?: string | null;
}

export interface Program {
  id: string;
  university: string;
  program: string;
  officialUrl: string;
  degree: TargetDegree;
  majorCategory: string; // theo Supported Major Taxonomy, mục 4.4
  teachingLanguage: "English" | "German" | "English & German";

  city: string;
  state?: string;
  country: "Germany";
  publicPrivate: "Public" | "Private";
  rankingTier: 1 | 2 | 3 | "unknown"; // chỉ hiển thị, không dùng tính Match Score

  requirement: ProgramRequirement;

  tuitionFeePerYearEur: number | null;
  intake: string[];
  applicationDeadline: string | null;

  scholarships: Scholarship[];
  logo: SchoolLogo;
  image: SchoolImage;

  sourceUrl: string;
  curatedBy: string;
  lastVerifiedAt: string;
  status: "draft" | "active" | "needs_review" | "discontinued";
}

// --- MatchedProgram (mục 7.4, đổi tên từ MatchedSchool ở v3) ---
export interface FitDetail {
  profileScore: number | null;
  requiredScoreEquivalent: number;
  fitRatio: number | null;
  status: "evaluated" | "not_evaluated";
}

export interface FitBreakdown {
  academic: FitDetail;
  language: FitDetail;
  majorFit: { score: number };
}

export interface MatchedProgram {
  programId: string;
  university: string;
  program: string;
  officialUrl: string;
  matchScore: number;
  matchLevel: MatchLevel;
  matchLevelExplanation: string;
  verdictLine: string; // mục 6.7.1 (v4.1)
  rankingTier: 1 | 2 | 3 | "unknown"; // mục 6.7.2 (v4.1)
  fitBreakdown: FitBreakdown;
  summary: string[];
  budgetSuggestion: BudgetSuggestion;
  scholarships: Scholarship[];
  logo: SchoolLogo;
  image: SchoolImage;
  lastVerifiedAt: string;
}

// --- Raw AI CV parsing output (mục 4.8) — snake_case, nullable, pre-normalization ---
export interface CvParseRaw {
  current_education: string | null;
  gpa: number | null;
  gpa_scale: number | null;
  english: { type: string | null; score: number | null } | null;
  german: { type: string | null; level: string | null } | null;
  academic_certificates: { name: string | null; score: string | null }[] | null;
  major: string[] | null;
  experience: string | null;
  research: string | null;
  activities: string | null;
}

// --- Draft dùng để auto-fill form CV Input (mục 4.2) — không phải Profile hợp lệ,
// vì targetDegree CV thường không có sẵn. User review & edit trước khi Profile thật sự
// được tạo ở bước Submit (mục 4.10).
export interface ProfileDraft {
  currentEducation?: string;
  gpa?: { original: number; scale: number; normalized: number };
  english?: Certificate;
  german?: Certificate;
  academicCertificates?: AcademicCertificate[];
  interestedMajors?: string[];
  activities?: string;
  experience?: string;
  research?: string;
}
