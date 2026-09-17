// Chỉ báo hoàn thành hồ sơ real-time (mục 4.5) — bám theo 4 Required Field.
export interface RequiredFieldStatus {
  key: string;
  label: string;
  state: "empty" | "valid" | "invalid";
}

// v4.1 (mục 4.5 cập nhật): trạng thái thứ 3 đổi tên hiển thị từ "lỗi" (đỏ) sang "cần xem
// lại" (cam, status.warning) — field đang trong quá trình điền không phải lỗi hệ thống, dùng
// đỏ tạo cảm giác nghiêm trọng quá mức. Field name "invalid" giữ nguyên trong code (không
// đổi state machine), chỉ đổi MÀU/NHÃN hiển thị.
//
// Bố cục 2 khối tách biệt (progress bar tonal + danh sách dot-row) theo đúng
// march-mvp-demo-desktop.html (`.progress-card` + `.card` req-rows), đặt ở cột phải sticky.
export default function ProgressIndicator({ fields }: { fields: RequiredFieldStatus[] }) {
  const doneCount = fields.filter((f) => f.state === "valid").length;
  const pct = Math.round((doneCount / fields.length) * 100);

  return (
    <div className="space-y-3">
      <div className="rounded-xl p-4" style={{ background: "var(--momo-bg-tonal)" }}>
        <div className="flex items-center justify-between">
          <span className="text-label-s-medium" style={{ color: "var(--momo-brand-primary)" }}>
            Đã hoàn thành {doneCount}/{fields.length} mục
          </span>
          <span className="text-description-xs-regular" style={{ color: "var(--momo-brand-primary)" }}>
            {pct}%
          </span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "#ffffff" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: "var(--momo-brand-primary)" }}
          />
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}>
        {fields.map((f, i) => {
          const color = f.state === "valid" ? "var(--momo-success)" : f.state === "invalid" ? "var(--momo-warning)" : "var(--momo-text-hint)";
          const bg = f.state === "valid" ? "var(--momo-success-container)" : f.state === "invalid" ? "var(--momo-warning-container)" : "transparent";
          return (
            <div
              key={f.key}
              className="flex items-center gap-2.5 py-2"
              style={i > 0 ? { borderTop: "1px solid var(--momo-bg-surface)" } : undefined}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{
                  background: bg,
                  color,
                  border: f.state === "empty" ? "2px solid var(--momo-border-default)" : "none",
                }}
              >
                {f.state === "valid" && "✓"}
                {f.state === "invalid" && "!"}
              </span>
              <span className="text-description-default-regular" style={{ color: f.state === "invalid" ? color : "var(--momo-text-secondary)" }}>
                {f.label}
                {f.state === "invalid" && " — cần xem lại"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
