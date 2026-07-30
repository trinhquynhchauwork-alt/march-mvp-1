// Academic — theo GPA quy về thang 4.0 (spec cũ mục 4.2a, giữ nguyên bảng điểm).

export function scoreAcademic(gpaNormalized4: number): number {
  if (gpaNormalized4 >= 3.5) return 90;
  if (gpaNormalized4 >= 3.0) return 75;
  if (gpaNormalized4 >= 2.5) return 60;
  return 40;
}
