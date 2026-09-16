// Thanh điểm — hiển thị trạng thái tĩnh, không clickable (mục 3.5). Dùng brand.primary
// (accent) cho thanh vì đây là chỉ báo mức độ (0-100), không phải phân loại tốt/xấu 4 mức.
export default function ProgressBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--momo-bg-surface)" }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${clamped}%`, background: "var(--momo-brand-primary)" }}
      />
    </div>
  );
}
