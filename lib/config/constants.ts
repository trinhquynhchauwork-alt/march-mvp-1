// Hằng số Đức — cập nhật hàng năm, gom một chỗ duy nhất (spec mục 4.6 bản cũ).
// Nguồn: DAAD / Auswärtiges Amt. Review lại mỗi năm.

export const GERMANY_VISA_PROOF_EUR = 11904; // Sperrkonto 2026
export const GERMANY_LIVING_MID_EUR = 14400; // chi phí sinh hoạt trung bình/năm (~1.200€/tháng)
export const GERMANY_LIVING_HIGH_EUR = 18000; // chi phí thành phố đắt (Munich/Frankfurt)

// Tỷ giá tĩnh (MVP không gọi API tỷ giá động — xem trade-off đã thống nhất với user).
export const VND_EUR_RATE = 27000; // 1 EUR ≈ 27,000 VND

export const AI_MAX_CALLS_PER_SESSION = 3;
export const AI_RETRY_COUNT = 1;
