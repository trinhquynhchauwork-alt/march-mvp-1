import type { AcademicCertificate, TargetDegree } from "@/types/domain";

// Academic Certificate — số lượng chứng chỉ học thuật (GRE/GMAT...), có xét bậc học
// (spec cũ mục 4.2d, giữ nguyên bảng). Không tính chứng chỉ ngôn ngữ ở đây.
export function scoreCertificate(
  academicCertificates: AcademicCertificate[],
  targetDegree: TargetDegree
): number {
  const count = academicCertificates.length;
  if (count >= 2) return 90;
  if (count === 1) return 75;
  return targetDegree === "Bachelor" ? 65 : 50;
}
