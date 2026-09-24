"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CURRENT_EDUCATION_OPTIONS,
  TARGET_DEGREE_OPTIONS,
  ENGLISH_CERT_TYPES,
  GERMAN_CERT_TYPES,
  GERMAN_LEVELS_BY_TYPE,
  MAJOR_OPTIONS,
} from "@/lib/config/formOptions";
import { normalizeGpa } from "@/lib/normalize/gpa";
import ProgressIndicator, { type RequiredFieldStatus } from "@/components/cv-input/ProgressIndicator";
import type { AcademicCertificate, Profile, ProfileDraft } from "@/types/domain";

// Chỉ chọn 1 ngành quan tâm (theo yêu cầu Product) — chip hoạt động như radio group.
const MAX_MAJORS = 1;

interface FormState {
  currentEducation: string;
  targetDegree: string;
  gpaOriginal: string;
  gpaScale: string;
  expectedIntake: string;
  englishType: string;
  englishScore: string;
  germanType: string;
  germanLevel: string;
  interestedMajors: string[];
  academicCertificates: AcademicCertificate[];
  activities: string;
}

const EMPTY_FORM: FormState = {
  currentEducation: "",
  targetDegree: "",
  gpaOriginal: "",
  gpaScale: "4.0",
  expectedIntake: "",
  englishType: "",
  englishScore: "",
  germanType: "",
  germanLevel: "",
  interestedMajors: [],
  academicCertificates: [],
  activities: "",
};

const LABEL_CLASS = "flex items-center gap-1.5 text-header-xs-semibold uppercase tracking-wide";
const INPUT_CLASS = "mt-1.5 w-full rounded-lg p-2.5 text-body-default-regular focus:outline-none disabled:opacity-50";
const INPUT_STYLE = { border: "1px solid var(--momo-border-default)", color: "var(--momo-text-default)" } as const;
const LABEL_STYLE = { color: "var(--momo-text-secondary)" } as const;

// Nhãn "Không bắt buộc" thay cho dấu * (mục 4.5) — không dùng màu status/accent, chỉ là
// chú thích trung tính (token header_xs_semibold, mục 3.6.3).
function OptionalTag() {
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[10px] font-normal normal-case"
      style={{ background: "var(--momo-bg-surface)", color: "var(--momo-text-hint)" }}
    >
      Không bắt buộc
    </span>
  );
}

function draftToFormState(draft: ProfileDraft): Partial<FormState> {
  const state: Partial<FormState> = {};

  if (draft.currentEducation && (CURRENT_EDUCATION_OPTIONS as readonly string[]).includes(draft.currentEducation)) {
    state.currentEducation = draft.currentEducation;
  }
  if (draft.gpa) {
    state.gpaOriginal = String(draft.gpa.original);
    state.gpaScale = String(draft.gpa.scale);
  }
  if (draft.english?.type && draft.english.score != null) {
    state.englishType = draft.english.type;
    state.englishScore = String(draft.english.score);
  }
  if (draft.german?.type && draft.german.level) {
    state.germanType = draft.german.type;
    state.germanLevel = draft.german.level;
  }
  if (draft.academicCertificates) state.academicCertificates = draft.academicCertificates;
  if (draft.interestedMajors) state.interestedMajors = draft.interestedMajors.slice(0, MAX_MAJORS);
  if (draft.activities) state.activities = draft.activities;

  return state;
}

// experience/research của Profile (mục 7.1) chỉ đến từ AI CV parsing, không có ô nhập
// riêng trong form (mục 4.4) — carry ngầm để Insight dùng, không hiển thị UI.
export default function ProfileForm({
  draft,
  hiddenExperience,
  hiddenResearch,
  onSubmit,
  cvUpload,
}: {
  draft: ProfileDraft | null;
  hiddenExperience?: string;
  hiddenResearch?: string;
  onSubmit: (profile: Profile) => void;
  cvUpload?: ReactNode;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [showOptional, setShowOptional] = useState(false);

  const currentEducationRef = useRef<HTMLSelectElement>(null);
  const targetDegreeRef = useRef<HTMLSelectElement>(null);
  const gpaRef = useRef<HTMLInputElement>(null);
  const majorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draft) return;
    // Defer past the effect's synchronous pass (react-hooks/set-state-in-effect).
    queueMicrotask(() => setForm((prev) => ({ ...prev, ...draftToFormState(draft) })));
  }, [draft]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMajor(major: string) {
    setForm((prev) => {
      if (MAX_MAJORS === 1) {
        // Radio-like: bấm lại mục đang chọn để bỏ chọn, bấm mục khác để thay thế lựa chọn cũ.
        return { ...prev, interestedMajors: prev.interestedMajors.includes(major) ? [] : [major] };
      }
      if (prev.interestedMajors.includes(major)) {
        return { ...prev, interestedMajors: prev.interestedMajors.filter((m) => m !== major) };
      }
      if (prev.interestedMajors.length >= MAX_MAJORS) return prev;
      return { ...prev, interestedMajors: [...prev.interestedMajors, major] };
    });
  }

  function addCertificate() {
    setForm((prev) => ({
      ...prev,
      academicCertificates: [...prev.academicCertificates, { name: "", score: "" }],
    }));
  }

  function updateCertificate(index: number, field: "name" | "score", value: string) {
    setForm((prev) => ({
      ...prev,
      academicCertificates: prev.academicCertificates.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  }

  function removeCertificate(index: number) {
    setForm((prev) => ({
      ...prev,
      academicCertificates: prev.academicCertificates.filter((_, i) => i !== index),
    }));
  }

  // Chỉ báo hoàn thành real-time (mục 4.5) — 4 required field: Current Education, Target
  // Degree, GPA, Interested Major. Cập nhật ngay khi form thay đổi, không cần blur/submit.
  const gpaOriginalNum = Number(form.gpaOriginal);
  const gpaScaleNum = Number(form.gpaScale);
  const gpaState: RequiredFieldStatus["state"] = !form.gpaOriginal
    ? "empty"
    : Number.isNaN(gpaOriginalNum) ||
        gpaOriginalNum <= 0 ||
        !form.gpaScale ||
        Number.isNaN(gpaScaleNum) ||
        gpaScaleNum <= 0 ||
        gpaOriginalNum > gpaScaleNum
      ? "invalid"
      : "valid";

  const requiredFields: RequiredFieldStatus[] = useMemo(
    () => [
      { key: "currentEducation", label: "Trình độ hiện tại", state: form.currentEducation ? "valid" : "empty" },
      { key: "targetDegree", label: "Bậc học mong muốn", state: form.targetDegree ? "valid" : "empty" },
      { key: "gpa", label: "GPA", state: gpaState },
      { key: "majors", label: "Ngành quan tâm", state: form.interestedMajors.length > 0 ? "valid" : "empty" },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.currentEducation, form.targetDegree, form.gpaOriginal, form.gpaScale, form.interestedMajors, gpaState]
  );

  const allRequiredReady = requiredFields.every((f) => f.state === "valid");

  function scrollToFirstMissing() {
    const first = requiredFields.find((f) => f.state !== "valid");
    if (!first) return;
    const refMap: Record<string, React.RefObject<HTMLElement | null>> = {
      currentEducation: currentEducationRef,
      targetDegree: targetDegreeRef,
      gpa: gpaRef,
      majors: majorsRef,
    };
    const el = refMap[first.key]?.current;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLElement && "focus" in el) el.focus();
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (form.interestedMajors.length > MAX_MAJORS) {
      errs.push(`Chỉ được chọn tối đa ${MAX_MAJORS} ngành quan tâm.`);
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Nút Submit chỉ "sẵn sàng" khi đủ 4/4 required (mục 4.5) — nếu chưa, không hiện lỗi
    // mới, chỉ cuộn tới field đầu tiên còn thiếu (user đã được báo liên tục lúc điền).
    if (!allRequiredReady) {
      scrollToFirstMissing();
      return;
    }

    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;

    const gpaOriginal = Number(form.gpaOriginal);
    const gpaScale = Number(form.gpaScale);

    const profile: Profile = {
      currentEducation: form.currentEducation as Profile["currentEducation"],
      targetDegree: form.targetDegree as Profile["targetDegree"],
      gpa: {
        original: gpaOriginal,
        scale: gpaScale,
        normalized: normalizeGpa(gpaOriginal, gpaScale),
      },
      english: form.englishType && form.englishScore ? { type: form.englishType, score: Number(form.englishScore) } : undefined,
      german: form.germanType && form.germanLevel ? { type: form.germanType, level: form.germanLevel } : undefined,
      academicCertificates: form.academicCertificates.filter((c) => c.name.trim() && c.score.trim()),
      interestedMajors: form.interestedMajors,
      expectedIntake: form.expectedIntake || undefined,
      activities: form.activities || undefined,
      experience: hiddenExperience,
      research: hiddenResearch,
    };

    onSubmit(profile);
  }

  const germanLevelOptions = form.germanType ? GERMAN_LEVELS_BY_TYPE[form.germanType as keyof typeof GERMAN_LEVELS_BY_TYPE] : [];

  return (
    // Bố cục 2 cột (form bên trái, tiến trình + submit sticky bên phải) đúng
    // march-mvp-demo-desktop.html (`.layout-2col`) — form là <form> ở cấp cao nhất để nút
    // Submit ở cột phải vẫn submit được dù nằm ngoài khối field bên trái.
    <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5 rounded-2xl p-6" style={{ background: "var(--momo-bg-default)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        <h2 className="text-header-m-bold" style={{ color: "var(--momo-text-default)" }}>
          Tải CV lên
        </h2>
        {cvUpload}

        {/* Divider "hoặc nhập thủ công" (mục 4.2.2, v4.1) — Upload CV đứng trước component này */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--momo-border-default)" }} />
          <span className="text-description-default-regular" style={{ color: "var(--momo-text-hint)" }}>
            hoặc nhập thủ công
          </span>
          <div className="h-px flex-1" style={{ background: "var(--momo-border-default)" }} />
        </div>

      {/* Block bắt buộc: Trình độ hiện tại, Bậc học mong muốn, GPA, Năm nhập học dự kiến (mục 4.2.2) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>
            Trình độ hiện tại <span style={{ color: "var(--momo-brand-primary)" }}>*</span>
          </label>
          <select
            ref={currentEducationRef}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            value={form.currentEducation}
            onChange={(e) => update("currentEducation", e.target.value)}
          >
            <option value="">-- Chọn --</option>
            {CURRENT_EDUCATION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>
            Bậc học mong muốn <span style={{ color: "var(--momo-brand-primary)" }}>*</span>
          </label>
          <select
            ref={targetDegreeRef}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            value={form.targetDegree}
            onChange={(e) => update("targetDegree", e.target.value)}
          >
            <option value="">-- Chọn --</option>
            {TARGET_DEGREE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS} style={LABEL_STYLE}>
              GPA <span style={{ color: "var(--momo-brand-primary)" }}>*</span>
            </label>
            <input
              ref={gpaRef}
              type="number"
              step="0.01"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              value={form.gpaOriginal}
              onChange={(e) => update("gpaOriginal", e.target.value)}
              placeholder="vd 3.75"
            />
          </div>
          <div>
            <label className={LABEL_CLASS} style={LABEL_STYLE}>
              Thang điểm
            </label>
            <input
              type="number"
              step="0.1"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              value={form.gpaScale}
              onChange={(e) => update("gpaScale", e.target.value)}
              placeholder="vd 4.0"
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS} style={LABEL_STYLE}>
            Năm nhập học dự kiến <OptionalTag />
          </label>
          <input
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            value={form.expectedIntake}
            onChange={(e) => update("expectedIntake", e.target.value)}
            placeholder="vd 2027"
          />
        </div>
      </div>

      {/* Chứng chỉ ngoại ngữ — optional nhưng ảnh hưởng trực tiếp Language Score (mục 4.2.2) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS} style={LABEL_STYLE}>
              Tiếng Anh <OptionalTag />
            </label>
            <select className={INPUT_CLASS} style={INPUT_STYLE} value={form.englishType} onChange={(e) => update("englishType", e.target.value)}>
              <option value="">Chưa thi</option>
              {ENGLISH_CERT_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS} style={LABEL_STYLE}>
              Điểm
            </label>
            <input
              type="number"
              step="0.5"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              value={form.englishScore}
              onChange={(e) => update("englishScore", e.target.value)}
              disabled={!form.englishType}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLASS} style={LABEL_STYLE}>
              Tiếng Đức <OptionalTag />
            </label>
            <select
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              value={form.germanType}
              onChange={(e) => {
                update("germanType", e.target.value);
                update("germanLevel", "");
              }}
            >
              <option value="">Chưa thi</option>
              {GERMAN_CERT_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS} style={LABEL_STYLE}>
              Trình độ
            </label>
            <select
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              value={form.germanLevel}
              onChange={(e) => update("germanLevel", e.target.value)}
              disabled={!form.germanType}
            >
              <option value="">--</option>
              {germanLevelOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ngành quan tâm — bắt buộc, đặt sau khi đã nhập xong thông tin định lượng (mục 4.2.2) */}
      <div ref={majorsRef} tabIndex={-1}>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>
          Ngành quan tâm <span style={{ color: "var(--momo-brand-primary)" }}>*</span>
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {MAJOR_OPTIONS.map((major) => {
            const selected = form.interestedMajors.includes(major);
            const disabled = MAX_MAJORS > 1 && !selected && form.interestedMajors.length >= MAX_MAJORS;
            return (
              <button
                type="button"
                key={major}
                disabled={disabled}
                onClick={() => toggleMajor(major)}
                className="rounded-full px-3 py-1 text-label-default-medium transition-colors"
                style={{
                  border: `1px solid ${selected ? "var(--momo-brand-primary)" : "var(--momo-border-default)"}`,
                  background: selected ? "var(--momo-brand-primary)" : "transparent",
                  color: selected ? "#ffffff" : disabled ? "var(--momo-text-disabled)" : "var(--momo-text-secondary)",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {major}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nhóm optional còn lại — gộp vào 1 khối thu gọn, mặc định đóng (mục 4.2.2) */}
      <details className="rounded-xl" style={{ border: "1px solid var(--momo-border-default)" }} onToggle={(e) => setShowOptional(e.currentTarget.open)}>
        <summary className="cursor-pointer list-none px-4 py-3 text-body-default-regular" style={{ color: "var(--momo-text-default)", fontWeight: 500 }}>
          Thông tin bổ sung (không bắt buộc) {showOptional ? "▲" : "▼"}
        </summary>
        <div className="space-y-4 px-4 pb-4">
          <div>
            <label className={LABEL_CLASS} style={LABEL_STYLE}>
              Chứng chỉ học thuật (GRE, GMAT, GATE, CFA...) <OptionalTag />
            </label>
            <div className="mt-1.5 space-y-2">
              {form.academicCertificates.map((cert, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={`${INPUT_CLASS} mt-0 min-w-0 flex-1`}
                    style={INPUT_STYLE}
                    placeholder="Tên (GRE, GMAT...)"
                    value={cert.name}
                    onChange={(e) => updateCertificate(i, "name", e.target.value)}
                  />
                  <input
                    className={`${INPUT_CLASS} mt-0 min-w-0 flex-1`}
                    style={INPUT_STYLE}
                    placeholder="Điểm"
                    value={cert.score}
                    onChange={(e) => updateCertificate(i, "score", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeCertificate(i)}
                    className="shrink-0 rounded-lg px-3 text-body-default-regular"
                    style={{ border: "1px solid var(--momo-border-default)", color: "var(--momo-text-secondary)" }}
                  >
                    Xoá
                  </button>
                </div>
              ))}
              <button type="button" onClick={addCertificate} className="text-body-default-regular" style={{ color: "var(--momo-brand-primary)", fontWeight: 500 }}>
                + Thêm chứng chỉ
              </button>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS} style={LABEL_STYLE}>
              Hoạt động & Thành tích <OptionalTag />
            </label>
            <textarea
              className={INPUT_CLASS}
              style={INPUT_STYLE}
              rows={3}
              value={form.activities}
              onChange={(e) => update("activities", e.target.value)}
            />
          </div>
        </div>
      </details>
      </div>

      {/* Cột phải sticky — tiến trình + checklist + Submit (mục 4.5), tách khỏi khối field
          bên trái đúng bố cục demo, cùng nằm trong <form> nên nút Submit vẫn hoạt động. */}
      <div className="space-y-4 lg:sticky lg:top-24">
        <ProgressIndicator fields={requiredFields} />

        {errors.length > 0 && (
          <div className="rounded-lg p-3 text-body-default-regular" style={{ background: "var(--momo-error-container)", color: "var(--momo-error)" }}>
            <ul className="list-disc pl-5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg px-5 py-3 text-action-default-bold transition-colors"
          style={
            allRequiredReady
              ? { background: "var(--momo-brand-primary)", color: "#ffffff", boxShadow: "0 4px 16px rgba(235,47,150,0.24)" }
              : { background: "var(--momo-bg-surface)", color: "var(--momo-text-disabled)", cursor: "not-allowed" }
          }
        >
          {allRequiredReady
            ? "Phân tích hồ sơ →"
            : `Hoàn thành hồ sơ (${requiredFields.filter((f) => f.state === "valid").length}/${requiredFields.length})`}
        </button>
      </div>
    </form>
  );
}
