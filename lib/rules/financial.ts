import {
  GERMANY_VISA_PROOF_EUR,
  GERMANY_LIVING_MID_EUR,
  GERMANY_LIVING_HIGH_EUR,
} from "@/lib/config/constants";

// Financial — budget/năm quy ra EUR so với mốc chi phí Đức (spec cũ mục 4.2c, giữ nguyên bảng).
export function scoreFinancial(budgetEur: number): number {
  if (budgetEur >= GERMANY_LIVING_HIGH_EUR) return 90; // >= 18,000
  if (budgetEur >= GERMANY_LIVING_MID_EUR) return 75; // 14,400 - 17,999
  if (budgetEur >= GERMANY_VISA_PROOF_EUR) return 60; // 11,904 - 14,399
  if (budgetEur >= 9500) return 40; // 9,500 - 11,903
  return 25; // < 9,500
}
