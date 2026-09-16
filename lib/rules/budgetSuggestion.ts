import { COST_OF_LIVING_EUR_PER_YEAR } from "@/lib/config/constants";
import type { BudgetSuggestion } from "@/types/domain";

const NON_EU_NOTE =
  "Học phí công lập Đức thường miễn phí với sinh viên EU/EEA; sinh viên ngoài EU có thể phải đóng phí tùy bang. Số liệu trên là ước tính cho diện Non-EU.";

// Budget Suggestion (mục 6.8) — display-only, không ảnh hưởng Match Score. Nguồn học phí
// giờ là Program.tuitionFeePerYearEur curate sẵn trong DB (number | null trực tiếp, mục
// 6.8.2) — không còn cần parse chuỗi tự do do AI trả về như v2/v3.
export function buildBudgetSuggestion(tuitionFeePerYearEur: number | null): BudgetSuggestion {
  const livingCostPerYearEur = COST_OF_LIVING_EUR_PER_YEAR;
  const totalEstimatedPerYearEur =
    tuitionFeePerYearEur != null ? tuitionFeePerYearEur + livingCostPerYearEur : null;

  return {
    tuitionFeePerYearEur,
    livingCostPerYearEur,
    totalEstimatedPerYearEur,
    assumption: "non-EU",
    note: NON_EU_NOTE,
  };
}
