// Quy đổi GPA về thang 4.0 (spec mục 4.5). Lưu cả gốc lẫn quy đổi.
export function normalizeGpa(original: number, scale: number): number {
  if (scale === 4.0) return Math.round(original * 100) / 100;
  const normalized = (original / scale) * 4.0;
  return Math.round(normalized * 100) / 100;
}
