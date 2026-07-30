import { VND_EUR_RATE } from "@/lib/config/constants";

// Budget luôn nhập VND, backend quy đổi sang EUR (spec mục 4.5).
export function vndToEur(vnd: number): number {
  return Math.round(vnd / VND_EUR_RATE);
}
