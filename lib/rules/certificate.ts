import type { AcademicCertificate } from "@/types/domain";

// Academic Certificate — số lượng chứng chỉ học thuật hợp lệ (GRE/GMAT/GATE/CFA...).
// Spec v2 mục 5.4.3: không còn phân biệt theo bậc học (khác v1).
export function scoreCertificate(academicCertificates: AcademicCertificate[]): number {
  const count = academicCertificates.length;
  if (count >= 2) return 100;
  if (count === 1) return 70;
  return 0;
}
