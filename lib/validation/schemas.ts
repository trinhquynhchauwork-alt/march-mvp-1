import { z } from "zod";

// --- Profile (input của /profile/insight và /schools/search) — validation theo mục 4.6 ---

export const certificateSchema = z.object({
  type: z.string(),
  score: z.number().optional(),
  level: z.string().optional(),
});

export const academicCertificateSchema = z.object({
  name: z.string(),
  score: z.string(),
});

export const currentEducationSchema = z.enum([
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
  "Chưa tốt nghiệp ĐH",
  "Đã tốt nghiệp ĐH",
]);

export const profileSchema = z
  .object({
    currentEducation: currentEducationSchema,
    targetDegree: z.enum(["Bachelor", "Master"]),
    gpa: z
      .object({
        original: z.number(),
        scale: z.number().positive(),
        normalized: z.number(),
      })
      .refine((g) => g.original > 0 && g.original <= g.scale, {
        message: "GPA phải > 0 và <= thang điểm",
      }),
    english: certificateSchema.optional(),
    german: certificateSchema.optional(),
    academicCertificates: z.array(academicCertificateSchema).default([]),
    annualBudget: z.object({
      vnd: z.number().positive(),
      eur: z.number().positive(),
    }),
    interestedMajors: z.array(z.string()).min(1, "Phải chọn tối thiểu một ngành"),
    expectedIntake: z.string().optional(),
    activities: z.string().optional(),
    experience: z.string().optional(),
    research: z.string().optional(),
  })
  .strict();

// --- AI CV Parsing output (mục 4.8) — lenient, mọi field có thể null ---

export const cvParseRawSchema = z.object({
  current_education: z.string().nullable().default(null),
  gpa: z.number().nullable().default(null),
  gpa_scale: z.number().nullable().default(null),
  english: z
    .object({ type: z.string().nullable(), score: z.number().nullable() })
    .nullable()
    .default(null),
  german: z
    .object({ type: z.string().nullable(), level: z.string().nullable() })
    .nullable()
    .default(null),
  academic_certificates: z
    .array(z.object({ name: z.string().nullable(), score: z.string().nullable() }))
    .nullable()
    .default(null),
  major: z.array(z.string()).nullable().default(null),
  experience: z.string().nullable().default(null),
  research: z.string().nullable().default(null),
  activities: z.string().nullable().default(null),
});

// --- AI Insight output (mục 5.9) ---

const softCriterionSchema = z.object({
  score: z.number().min(0).max(100),
  comment: z.string(),
});

export const insightAiOutputSchema = z.object({
  experience: softCriterionSchema,
  research: softCriterionSchema,
  leadership: softCriterionSchema,
  major_fit: softCriterionSchema,
  overall_comment: z.string(),
  // Spec muốn 3–5 next actions, nhưng không fail cả response (tốn 1 trong 3 AI call quota)
  // nếu model lệch 1 item — route handler sẽ clamp về tối đa 5 khi merge.
  next_actions: z.array(z.string()).min(1),
});

// --- AI School Search output (mục 9) ---

export const schoolSearchAiOutputSchema = z.array(
  z.object({
    university: z.string().nullable().optional(),
    program: z.string().nullable().optional(),
    official_url: z.string().nullable().optional(),
  })
);
