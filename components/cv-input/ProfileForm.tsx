"use client";

import { useEffect, useState } from "react";
import {
  CURRENT_EDUCATION_OPTIONS,
  TARGET_DEGREE_OPTIONS,
  ENGLISH_CERT_TYPES,
  GERMAN_CERT_TYPES,
  CEFR_LEVELS,
  MAJOR_OPTIONS,
} from "@/lib/config/formOptions";
import { normalizeGpa } from "@/lib/normalize/gpa";
import { vndToEur } from "@/lib/normalize/budget";
import type { AcademicCertificate, Profile, ProfileDraft } from "@/types/domain";

interface FormState {
  currentEducation: string;
  targetDegree: string;
  gpaOriginal: string;
  gpaScale: string;
  englishType: string;
  englishScore: string;
  germanType: string;
  germanLevel: string;
  academicCertificates: AcademicCertificate[];
  budgetVnd: string;
  interestedMajors: string[];
  expectedIntake: string;
  activities: string;
}

const EMPTY_FORM: FormState = {
  currentEducation: "",
  targetDegree: "",
  gpaOriginal: "",
  gpaScale: "4.0",
  englishType: "",
  englishScore: "",
  germanType: "",
  germanLevel: "",
  academicCertificates: [],
  budgetVnd: "",
  interestedMajors: [],
  expectedIntake: "",
  activities: "",
};

const LABEL_CLASS = "block text-xs font-semibold uppercase tracking-wide text-gray-500";
const INPUT_CLASS =
  "mt-1.5 w-full rounded-lg border border-gray-200 p-2.5 text-sm text-gray-900 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100 disabled:bg-gray-50 disabled:text-gray-400";

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
  if (draft.interestedMajors) state.interestedMajors = draft.interestedMajors;
  if (draft.activities) state.activities = draft.activities;

  return state;
}

// experience/research của Profile (mục 7.1) chỉ đến từ AI CV parsing, không có ô nhập
// riêng trong form 10-field (mục 4.4) — carry ngầm để Insight dùng, không hiển thị UI.
export default function ProfileForm({
  draft,
  hiddenExperience,
  hiddenResearch,
  onSubmit,
}: {
  draft: ProfileDraft | null;
  hiddenExperience?: string;
  hiddenResearch?: string;
  onSubmit: (profile: Profile) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!draft) return;
    // Defer past the effect's synchronous pass (react-hooks/set-state-in-effect).
    queueMicrotask(() => setForm((prev) => ({ ...prev, ...draftToFormState(draft) })));
  }, [draft]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMajor(major: string) {
    setForm((prev) => ({
      ...prev,
      interestedMajors: prev.interestedMajors.includes(major)
        ? prev.interestedMajors.filter((m) => m !== major)
        : [...prev.interestedMajors, major],
    }));
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
      academicCertificates: prev.academicCertificates.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  }

  function removeCertificate(index: number) {
    setForm((prev) => ({
      ...prev,
      academicCertificates: prev.academicCertificates.filter((_, i) => i !== index),
    }));
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!form.currentEducation) errs.push("Vui lòng chọn Current Education.");
    if (!form.targetDegree) errs.push("Vui lòng chọn Target Degree.");

    const gpaOriginal = Number(form.gpaOriginal);
    const gpaScale = Number(form.gpaScale);
    if (!form.gpaOriginal || Number.isNaN(gpaOriginal) || gpaOriginal <= 0) {
      errs.push("GPA phải lớn hơn 0.");
    } else if (!form.gpaScale || Number.isNaN(gpaScale) || gpaScale <= 0 || gpaOriginal > gpaScale) {
      errs.push("GPA phải <= thang điểm đã chọn.");
    }

    const budgetVnd = Number(form.budgetVnd);
    if (!form.budgetVnd || Number.isNaN(budgetVnd) || budgetVnd <= 0) {
      errs.push("Annual Budget phải lớn hơn 0.");
    }

    if (form.interestedMajors.length === 0) {
      errs.push("Vui lòng chọn tối thiểu một Interested Major.");
    }

    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;

    const gpaOriginal = Number(form.gpaOriginal);
    const gpaScale = Number(form.gpaScale);
    const budgetVnd = Number(form.budgetVnd);

    const profile: Profile = {
      currentEducation: form.currentEducation as Profile["currentEducation"],
      targetDegree: form.targetDegree as Profile["targetDegree"],
      gpa: {
        original: gpaOriginal,
        scale: gpaScale,
        normalized: normalizeGpa(gpaOriginal, gpaScale),
      },
      english:
        form.englishType && form.englishScore
          ? { type: form.englishType, score: Number(form.englishScore) }
          : undefined,
      german:
        form.germanType && form.germanLevel
          ? { type: form.germanType, level: form.germanLevel }
          : undefined,
      academicCertificates: form.academicCertificates.filter((c) => c.name.trim() && c.score.trim()),
      annualBudget: { vnd: budgetVnd, eur: vndToEur(budgetVnd) },
      interestedMajors: form.interestedMajors,
      expectedIntake: form.expectedIntake || undefined,
      activities: form.activities || undefined,
      experience: hiddenExperience,
      research: hiddenResearch,
    };

    onSubmit(profile);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-base font-semibold text-gray-900">Hồ sơ của bạn</h2>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <ul className="list-disc pl-5">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 1. Current Education */}
        <div>
          <label className={LABEL_CLASS}>
            Cấp học hiện tại <span className="text-pink-500">*</span>
          </label>
          <select
            className={INPUT_CLASS}
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

        {/* 2. Target Degree */}
        <div>
          <label className={LABEL_CLASS}>
            Bằng cấp mục tiêu <span className="text-pink-500">*</span>
          </label>
          <select
            className={INPUT_CLASS}
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
        {/* 3. GPA */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLASS}>
              GPA <span className="text-pink-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              className={INPUT_CLASS}
              value={form.gpaOriginal}
              onChange={(e) => update("gpaOriginal", e.target.value)}
              placeholder="vd 3.75"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Thang điểm</label>
            <input
              type="number"
              step="0.1"
              className={INPUT_CLASS}
              value={form.gpaScale}
              onChange={(e) => update("gpaScale", e.target.value)}
              placeholder="vd 4.0"
            />
          </div>
        </div>

        {/* 4. English Certificate */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLASS}>Tiếng Anh</label>
            <select
              className={INPUT_CLASS}
              value={form.englishType}
              onChange={(e) => update("englishType", e.target.value)}
            >
              <option value="">Chưa thi</option>
              {ENGLISH_CERT_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Điểm</label>
            <input
              type="number"
              step="0.5"
              className={INPUT_CLASS}
              value={form.englishScore}
              onChange={(e) => update("englishScore", e.target.value)}
              disabled={!form.englishType}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 5. German Certificate */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLASS}>Tiếng Đức</label>
            <select
              className={INPUT_CLASS}
              value={form.germanType}
              onChange={(e) => update("germanType", e.target.value)}
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
            <label className={LABEL_CLASS}>CEFR</label>
            <select
              className={INPUT_CLASS}
              value={form.germanLevel}
              onChange={(e) => update("germanLevel", e.target.value)}
              disabled={!form.germanType}
            >
              <option value="">--</option>
              {CEFR_LEVELS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7. Annual Budget */}
        <div>
          <label className={LABEL_CLASS}>
            Budget mỗi năm (VND) <span className="text-pink-500">*</span>
          </label>
          <input
            type="number"
            className={INPUT_CLASS}
            value={form.budgetVnd}
            onChange={(e) => update("budgetVnd", e.target.value)}
            placeholder="vd 500.000.000"
          />
        </div>
      </div>

      {/* 6. Academic Certificates */}
      <div>
        <label className={LABEL_CLASS}>Chứng chỉ khác</label>
        <div className="mt-1.5 space-y-2">
          {form.academicCertificates.map((cert, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={`${INPUT_CLASS} mt-0 w-1/2`}
                placeholder="Tên (GRE, GMAT...)"
                value={cert.name}
                onChange={(e) => updateCertificate(i, "name", e.target.value)}
              />
              <input
                className={`${INPUT_CLASS} mt-0 w-1/2`}
                placeholder="Điểm"
                value={cert.score}
                onChange={(e) => updateCertificate(i, "score", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeCertificate(i)}
                className="rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-50"
              >
                Xoá
              </button>
            </div>
          ))}
          <button type="button" onClick={addCertificate} className="text-sm font-medium text-pink-600 hover:underline">
            + Thêm chứng chỉ
          </button>
        </div>
      </div>

      {/* 8. Interested Major */}
      <div>
        <label className={LABEL_CLASS}>
          Ngành quan tâm — chọn ít nhất 1 <span className="text-pink-500">*</span>
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {MAJOR_OPTIONS.map((major) => {
            const selected = form.interestedMajors.includes(major);
            return (
              <button
                type="button"
                key={major}
                onClick={() => toggleMajor(major)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selected
                    ? "border-pink-500 bg-pink-500 text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {major}
              </button>
            );
          })}
        </div>
      </div>

      {/* 9. Expected Intake */}
      <div>
        <label className={LABEL_CLASS}>Năm dự kiến nhập học</label>
        <input
          className={INPUT_CLASS}
          value={form.expectedIntake}
          onChange={(e) => update("expectedIntake", e.target.value)}
          placeholder="vd 2027"
        />
      </div>

      {/* 10. Activities & Achievements */}
      <div>
        <label className={LABEL_CLASS}>Hoạt động & Thành tích</label>
        <textarea className={INPUT_CLASS} rows={3} value={form.activities} onChange={(e) => update("activities", e.target.value)} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-pink-500 to-fuchsia-500 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Phân tích hồ sơ →
        </button>
      </div>
    </form>
  );
}
