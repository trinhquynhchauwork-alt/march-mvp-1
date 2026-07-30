import type { TargetDegree } from "@/types/domain";

// Nhận xét template cho 4 tiêu chí rule-based (mục 5.3 yêu cầu "nhận xét từng tiêu chí"
// cho cả 8 tiêu chí, nhưng Prompt 2 (mục 5.9) không có field comment cho rule criteria —
// dùng template backend, không AI, cùng cách tiếp cận với School Matching bullet (mục 6.7).

export function academicComment(score: number): string {
  if (score >= 90) return "GPA thuộc nhóm cạnh tranh cao cho hồ sơ du học Đức.";
  if (score >= 75) return "GPA ở mức khá, cạnh tranh tốt cho phần lớn chương trình.";
  if (score >= 60) return "GPA ở mức trung bình, có thể cần cải thiện để cạnh tranh hơn.";
  return "GPA hiện khá thấp so với mặt bằng chung.";
}

export function languageComment(score: number): string {
  if (score >= 90) return "Chứng chỉ ngôn ngữ ở mức xuất sắc.";
  if (score >= 80) return "Chứng chỉ ngôn ngữ tốt, đáp ứng tốt yêu cầu phổ biến.";
  if (score >= 65) return "Chứng chỉ ngôn ngữ đạt mức cơ bản, có thể cần nâng cao thêm.";
  return "Chứng chỉ ngôn ngữ còn thấp so với yêu cầu phổ biến.";
}

export function financialComment(score: number): string {
  if (score >= 90) return "Ngân sách dư dả cho phần lớn thành phố tại Đức.";
  if (score >= 75) return "Ngân sách thoải mái ở phần lớn thành phố, hơi rướn ở thành phố đắt đỏ.";
  if (score >= 60)
    return "Ngân sách đủ điều kiện chứng minh tài chính visa, nên ưu tiên thành phố chi phí vừa/thấp.";
  if (score >= 40) return "Ngân sách chưa đủ mức chứng minh tài chính visa, cần bổ sung.";
  return "Ngân sách thiếu hụt đáng kể so với yêu cầu.";
}

export function certificateComment(score: number, targetDegree: TargetDegree): string {
  if (score >= 90) return "Có từ 2 chứng chỉ học thuật liên quan trở lên.";
  if (score >= 75) return "Có 1 chứng chỉ học thuật liên quan.";
  if (targetDegree === "Bachelor")
    return "Chưa có chứng chỉ học thuật bổ sung — không bị trừ điểm ở bậc Cử nhân.";
  return "Chưa có chứng chỉ học thuật bổ sung — nên cân nhắc GRE/GMAT cho bậc Thạc sĩ.";
}
