import type { SchoolImage, SchoolLogo } from "@/types/domain";

// Fallback Logo/Image (mục 7.9) — áp dụng khi Program.logo.logoUrl / Program.image.imageUrl
// rỗng trong School Database (seed file mục 15.5 để trống toàn bộ logoUrl/imageUrl, curate
// thật chưa có). Backend KHÔNG dùng AI để tìm ảnh/logo (tránh sai/link hỏng/vi phạm bản
// quyền) — luôn có giá trị hợp lệ, không bao giờ null (AC7/AC10).
const PLACEHOLDER_COLORS = ["8B5CF6", "3B82F6", "10B981", "F59E0B", "64748B"]; // hex, không dùng pink (màu accent, mục 3.5)

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.length >= 2 ? [words[0][0], words[1][0]] : [name.slice(0, 2)];
  return letters.join("").toUpperCase().slice(0, 2);
}

function placeholderColor(name: string): string {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PLACEHOLDER_COLORS[sum % PLACEHOLDER_COLORS.length];
}

// SVG data URI — không phụ thuộc mạng ngoài, không bao giờ broken link.
function buildMonogramSvg(name: string, size: number): string {
  const color = placeholderColor(name);
  const text = initials(name);
  const fontSize = Math.round(size * 0.4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#${color}"/><text x="${size / 2}" y="${size / 2 + fontSize * 0.35}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#ffffff" text-anchor="middle" font-weight="bold">${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Logo (mục 6.10.1) — huy hiệu nhận diện thương hiệu, góc trên-trái card, kích thước nhỏ.
export function resolveSchoolLogo(universityName: string, curated: SchoolLogo): SchoolLogo {
  if (curated.logoUrl) return curated;
  return { logoUrl: buildMonogramSvg(universityName, 96), logoSource: "placeholder" };
}

// Image (mục 6.10.1) — ảnh minh họa campus, banner phía trên card, kích thước lớn.
export function resolveSchoolImage(universityName: string, curated: SchoolImage): SchoolImage {
  if (curated.imageUrl) return curated;
  return { imageUrl: buildMonogramSvg(universityName, 400), imageSource: "placeholder" };
}
