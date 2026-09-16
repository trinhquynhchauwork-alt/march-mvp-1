// Academic — theo GPA quy về thang 4.0 (mục 5.4.1).

const GPA_BANDS = [
  { min: 3.8, score: 100 },
  { min: 3.6, score: 90 },
  { min: 3.3, score: 80 },
  { min: 3.0, score: 70 },
  { min: 2.7, score: 60 },
  { min: 0, score: 40 },
] as const;

export function scoreAcademic(gpaNormalized4: number): number {
  return GPA_BANDS.find((b) => gpaNormalized4 >= b.min)?.score ?? 40;
}

// Reverse lookup (mục 6.7.1, v4.1) — nghịch đảo bảng trên, dùng khi Program.requirement.minGpa4
// là null (baseline, mục 6.6.3) và cần hiển thị "cần đạt GPA bao nhiêu" bằng đơn vị gốc.
export function minGpaForScore(targetScore: number): number {
  const ascending = [...GPA_BANDS].sort((a, b) => a.min - b.min);
  return ascending.find((b) => b.score >= targetScore)?.min ?? ascending[ascending.length - 1].min;
}
