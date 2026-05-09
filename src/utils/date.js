// ─────────────────────────────────────────────
// 날짜 유틸
// ─────────────────────────────────────────────

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

// 그 날짜가 속한 주의 월요일 (월요일 시작)
export function weekStartKey(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day; // 일요일이면 6일 전 월요일, 그 외엔 (1-day)
  x.setDate(x.getDate() + diff);
  return dateKey(x);
}

// 표시할 주: 오늘이 일요일이면 이번 주, 아니면 지난 주
export function targetWeekStartKey() {
  const today = new Date();
  if (today.getDay() === 0) return weekStartKey(today); // 일요일 → 이번 주(월~일)
  // 월~토 → 지난 주
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay()); // 직전 일요일
  return weekStartKey(lastSunday);
}

// "11.18 - 11.24" 형식
export function formatWeekRange(weekStart) {
  const s = new Date(weekStart);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  const fmt = (d) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
  return `${fmt(s)} - ${fmt(e)}`;
}

export function formatRelativeTime(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
}

export function getCalendarDays(y, m) {
  const first = new Date(y, m, 1).getDay();
  const last = new Date(y, m + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < first; i++) days.push(null);
  for (let i = 1; i <= last; i++) days.push(i);
  return days;
}
