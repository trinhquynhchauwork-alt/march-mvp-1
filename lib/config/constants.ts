// Hằng số Đức — cập nhật hàng năm, gom một chỗ duy nhất.
// Nguồn: DAAD / Auswärtiges Amt. Review lại mỗi năm.

// Cost of Living Reference (mục 6.8.2) — 1 mức trung bình toàn quốc cho MVP.
// Spec v2 nói rõ "spec này không tự chốt con số, chỉ chốt cơ chế" — dùng đúng giá trị
// ví dụ trong spec (mục 6.8.4: livingCostPerYearEur: 11400) làm mặc định. CẦN đội
// Product/Content xác nhận trước khi launch thật.
export const COST_OF_LIVING_EUR_PER_YEAR = 11400;

// v4 (mục 3.3/9): School Search AI call đã bị loại bỏ — còn CV Parse + Insight.
export const AI_MAX_CALLS_PER_SESSION = 2;
export const AI_RETRY_COUNT = 1;
