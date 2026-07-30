// Domain types — mirrors spec mục 7 (Data Model) exactly. Do not add fields not in spec.

export type TargetDegree = "Bachelor" | "Master";

export type CurrentEducation =
  | "Lớp 10"
  | "Lớp 11"
  | "Lớp 12"
  | "Chưa tốt nghiệp ĐH"
  | "Đã tốt nghiệp ĐH";

export interface Certificate {
  type: string; // IELTS | TOEFL | Goethe | TestDaF | DSH | telc
  score?: number; // English: numeric score (IELTS scale, TOEFL converted at rule-time)
  level?: string; // German: CEFR level A1–C2
}

export interface AcademicCertificate {
  name: string; // GRE, GMAT...
  score: string;
}

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

  annualBudget: {
    vnd: number;
    eur: number;
  };

  interestedMajors: string[];

  expectedIntake?: string;
  activities?: string;

  experience?: string;
  research?: string;
}

export type CriterionId =
  | "academic"
  | "language"
  | "financial"
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
  evaluatedCount: number; // e.g. 7 (out of 8) — drives "Overall Score được tính trên X/8 tiêu chí"
}

export type MatchLevel = "Excellent" | "Good" | "Average";

export interface MatchedSchool {
  university: string;
  program: string;
  officialUrl: string;
  matchScore: number;
  matchLevel: MatchLevel;
  summary: string[];
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
// vì nhiều field bắt buộc (targetDegree, annualBudget...) CV thường không có sẵn.
// User review & edit trước khi Profile thật sự được tạo ở bước Submit (mục 4.10).
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
