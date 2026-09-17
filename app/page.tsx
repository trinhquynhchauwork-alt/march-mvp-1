"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PageHead from "@/components/layout/PageHead";
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
    <AppShell>
      <PageHead
        title="Nhập hồ sơ"
        description="Tải CV lên để tự động điền, hoặc nhập thủ công bên dưới."
        meta={draft ? "Đã phân tích CV" : undefined}
      />

      <ProfileForm
        draft={draft}
        hiddenExperience={hiddenExperience}
        hiddenResearch={hiddenResearch}
        onSubmit={handleSubmit}
        cvUpload={
          <CvUpload
            onParsed={(d, extra) => {
              setDraft(d);
              setHiddenExperience(extra.experience);
              setHiddenResearch(extra.research);
            }}
          />
        }
      />
    </AppShell>
  );
}
