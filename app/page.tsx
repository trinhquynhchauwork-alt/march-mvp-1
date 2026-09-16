"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import CvUpload from "@/components/cv-input/CvUpload";
import ProfileForm from "@/components/cv-input/ProfileForm";
import { saveProfile } from "@/lib/clientStorage";
import type { Profile, ProfileDraft } from "@/types/domain";

export default function CvInputPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [hiddenExperience, setHiddenExperience] = useState<string | undefined>();
  const [hiddenResearch, setHiddenResearch] = useState<string | undefined>();

  function handleSubmit(profile: Profile) {
    saveProfile(profile);
    router.push("/insight");
  }

  return (
    <AppShell title="Nhập hồ sơ" meta={draft ? "Đã phân tích CV" : undefined}>
      <p className="text-body-default-regular" style={{ color: "var(--momo-text-secondary)" }}>
        Upload CV để tự động điền hồ sơ, hoặc nhập tay trực tiếp. Bạn có thể chỉnh sửa mọi dữ liệu
        trước khi submit.
      </p>

      <div className="mt-4">
        <CvUpload
          onParsed={(d, extra) => {
            setDraft(d);
            setHiddenExperience(extra.experience);
            setHiddenResearch(extra.research);
          }}
        />
      </div>

      <div className="mt-6">
        <ProfileForm draft={draft} hiddenExperience={hiddenExperience} hiddenResearch={hiddenResearch} onSubmit={handleSubmit} />
      </div>
    </AppShell>
  );
}
