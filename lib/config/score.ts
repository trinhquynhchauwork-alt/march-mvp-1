// Hiển thị điểm theo thang 10 (vd "8.5/10") thay vì thang 100 gốc (theo yêu cầu user 24/09) —
// CHỈ đổi cách HIỂN THỊ, mọi rule/ngưỡng backend (Classification, Impact Score...) vẫn tính
// trên thang 100 như cũ (mục 5.4/5.6), không đổi Single Source of Truth (mục 3.2).
export function formatScore10(score: number): string {
  return (score / 10).toFixed(1);
}
