import { NEGATIVE } from "../lib/constants";
import { dateKey } from "./date";

// 오늘부터 거꾸로 — 기분 기록 연속된 날 수
export function calcStreak(moodLog) {
  let n = 0;
  const d = new Date();
  while (moodLog[dateKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// 오늘부터 거꾸로 — 부정 감정 연속된 날 수 (최대 7일)
export function countConsecNegative(log) {
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const k = dateKey(d);
    if (log[k] && NEGATIVE.includes(log[k])) {
      count++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return count;
}
