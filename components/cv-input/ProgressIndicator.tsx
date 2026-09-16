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
export default function ProgressIndicator({ fields }: { fields: RequiredFieldStatus[] }) {
  const doneCount = fields.filter((f) => f.state === "valid").length;

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--momo-bg-default)", border: "1px solid var(--momo-border-default)" }}>
      <div className="flex items-center justify-between">
        <span className="text-body-default-regular" style={{ color: "var(--momo-text-default)", fontWeight: 500 }}>
          Đã hoàn thành {doneCount}/{fields.length} mục bắt buộc
        </span>
        {doneCount === fields.length && (
          <span className="text-description-default-regular" style={{ color: "var(--momo-success)", fontWeight: 500 }}>
            Hoàn thành
          </span>
        )}
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--momo-bg-surface)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(doneCount / fields.length) * 100}%`, background: "var(--momo-success)" }}
        />
      </div>
      <ul className="mt-3 flex flex-wrap gap-3">
        {fields.map((f) => {
          const color =
            f.state === "valid" ? "var(--momo-success)" : f.state === "invalid" ? "var(--momo-warning)" : "var(--momo-text-hint)";
          return (
            <li
              key={f.key}
              className="flex items-center gap-1.5 rounded-full px-2 py-1 text-description-default-regular"
              style={{
                color: f.state === "empty" ? "var(--momo-text-hint)" : color,
                background: f.state === "valid" ? "var(--momo-success-container)" : f.state === "invalid" ? "var(--momo-warning-container)" : "transparent",
              }}
            >
              {f.state === "valid" && "✓"}
              {f.state === "invalid" && "!"}
              {f.state === "empty" && "○"}
              <span>{f.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
