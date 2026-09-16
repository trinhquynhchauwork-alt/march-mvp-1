"use client";

import { useRef, useState } from "react";
import type { ProfileDraft } from "@/types/domain";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (mục 15.4)

type UploadState = "idle" | "uploading" | "success" | "error";

// Upload CV — 4 trạng thái bắt buộc (mục 4.2.1, v4.1): idle/uploading/success/error, không
// để user chờ không phản hồi (AC-UX10/AC-UX11).
export default function CvUpload({
  onParsed,
}: {
  onParsed: (draft: ProfileDraft, extra: { experience?: string; research?: string }) => void;
}) {
  const [status, setStatus] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStatus("error");
      setError("File vượt quá 10MB. Vui lòng chọn file nhỏ hơn hoặc nhập tay bên dưới.");
      return;
    }

    setStatus("uploading");
    setFileName(file.name);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/parse", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        // Parse Failed (mục 4.9): không chặn flow, cho phép nhập thủ công.
        setStatus("error");
        setError(data.error ?? "Không parse được CV. Bạn có thể nhập thủ công bên dưới.");
        return;
      }

      setStatus("success");
      onParsed(data.draft ?? {}, {
        experience: data.draft?.experience,
        research: data.draft?.research,
      });
    } catch {
      setStatus("error");
      setError("Upload thất bại. Vui lòng thử lại.");
    }
  }

  function reset() {
    setStatus("idle");
    setError(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {status === "idle" && (
        <label
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center"
          style={{ borderColor: "var(--momo-brand-primary-tonal)", background: "var(--momo-bg-tonal)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 16V4m0 0 4 4m-4-4-4 4" stroke="var(--momo-brand-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="var(--momo-brand-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-body-default-regular" style={{ color: "var(--momo-text-default)", fontWeight: 500 }}>
            Chọn file hoặc kéo thả vào đây
          </span>
          <span className="text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
            Hỗ trợ PDF, DOCX — tối đa 10MB
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}

      {status === "uploading" && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-6" style={{ background: "var(--momo-bg-tonal)" }}>
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="var(--momo-brand-primary-tonal)" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="var(--momo-brand-primary)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-body-default-regular" style={{ color: "var(--momo-text-default)" }}>
              Đang đọc CV và điền tự động...
            </p>
            {fileName && (
              <p className="text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
                {fileName}
              </p>
            )}
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--momo-success-container)" }}>
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="var(--momo-success)" />
              <path d="M7.5 12.5 10.5 15.5 16.5 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-body-default-regular" style={{ color: "var(--momo-success)", fontWeight: 500 }}>
              Đã tự động điền từ CV của bạn
            </span>
          </div>
          <p className="mt-1 text-description-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
            Vui lòng kiểm tra lại thông tin bên dưới trước khi tiếp tục.
          </p>
          <button type="button" onClick={reset} className="mt-2 text-description-default-regular" style={{ color: "var(--momo-brand-primary)" }}>
            Upload file khác
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--momo-error-container)" }}>
          <p className="text-body-default-regular" style={{ color: "var(--momo-error)" }}>
            {error}
          </p>
          <button type="button" onClick={reset} className="mt-1 text-description-default-regular" style={{ color: "var(--momo-brand-primary)" }}>
            Upload lại
          </button>
        </div>
      )}
    </div>
  );
}
