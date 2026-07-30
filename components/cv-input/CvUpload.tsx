"use client";

import { useRef, useState } from "react";
import type { ProfileDraft } from "@/types/domain";

export default function CvUpload({
  onParsed,
}: {
  onParsed: (draft: ProfileDraft, extra: { experience?: string; research?: string }) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
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

      setStatus("idle");
      onParsed(data.draft ?? {}, {
        experience: data.draft?.experience,
        research: data.draft?.research,
      });
    } catch {
      setStatus("error");
      setError("Upload thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-pink-200 bg-pink-50/40 p-4">
      <p className="text-sm text-gray-600">
        Upload CV (PDF hoặc DOCX) để tự động điền hồ sơ — tuỳ chọn, có thể bỏ qua và nhập tay bên dưới.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="mt-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-pink-500 file:px-3 file:py-1.5 file:text-white file:hover:bg-pink-600"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {status === "uploading" && <p className="mt-2 text-sm text-pink-600">Đang đọc CV & trích xuất thông tin...</p>}
      {status === "error" && (
        <div className="mt-2 text-sm text-red-600">
          {error}{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setStatus("idle");
              setError(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Upload lại
          </button>
        </div>
      )}
    </div>
  );
}
