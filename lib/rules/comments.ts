// Nhận xét template cho 3 tiêu chí rule-based (mục 5.3 yêu cầu "nhận xét từng tiêu chí"
// cho cả 7 tiêu chí, nhưng Prompt 2 (mục 5.9) không có field comment cho rule criteria —
// dùng template backend, không AI, cùng cách tiếp cận với School Matching bullet (mục 6.7).

export function academicComment(score: number): string {
  if (score >= 90) return "GPA thuộc nhóm cạnh tranh cao cho hồ sơ du học Đức.";
  if (score >= 70) return "GPA ở mức khá, cạnh tranh tốt cho phần lớn chương trình.";
  if (score >= 60) return "GPA ở mức trung bình, có thể cần cải thiện để cạnh tranh hơn.";
  return "GPA hiện khá thấp so với mặt bằng chung.";
}

export function languageComment(score: number): string {
  if (score >= 90) return "Chứng chỉ ngôn ngữ ở mức xuất sắc.";
  if (score >= 80) return "Chứng chỉ ngôn ngữ tốt, đáp ứng tốt yêu cầu phổ biến.";
  if (score >= 60) return "Chứng chỉ ngôn ngữ đạt mức cơ bản, có thể cần nâng cao thêm.";
  return "Chứng chỉ ngôn ngữ còn thấp so với yêu cầu phổ biến.";
}

export function certificateComment(score: number): string {
  if (score >= 100) return "Có từ 2 chứng chỉ học thuật (GRE/GMAT/GATE/CFA...) hợp lệ trở lên.";
  if (score >= 70) return "Có 1 chứng chỉ học thuật hợp lệ.";
  return "Chưa có chứng chỉ học thuật bổ sung (GRE/GMAT/GATE/CFA...).";
}
