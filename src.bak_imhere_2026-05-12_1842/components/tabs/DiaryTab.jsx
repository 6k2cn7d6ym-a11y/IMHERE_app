import { useState, useEffect } from "react";
import { C, EMOTIONS, MONTH_KR, DAY_KR } from "../../lib/constants";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { dateKey, todayKey, getCalendarDays } from "../../utils/date";

export default function DiaryTab({ moodLog, moodLogsByDate = {}, setDiaryView }) {
  const { user } = useAuth();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [monthSummaries, setMonthSummaries] = useState({}); // {date: summary}
  const days = getCalendarDays(y, m);
  const tk = todayKey();
  const total = Object.keys(moodLog).length;
  const top = EMOTIONS.map((e) => ({
    ...e,
    count: Object.values(moodLog).filter((v) => v === e.label).length,
  }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  // 그 달 daily_summaries 한 번에 fetch
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    (async () => {
      try {
        const { data } = await supabase
          .from("daily_summaries")
          .select("date, summary")
          .eq("user_id", user.id)
          .gte("date", start)
          .lte("date", end);
        if (cancelled) return;
        const map = {};
        (data || []).forEach((r) => { map[r.date] = r.summary; });
        setMonthSummaries(map);
      } catch (e) {
        console.error("월별 요약 불러오기 실패:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, y, m]);

  const prevM = () => {
    setSelectedDate(null);
    if (m === 0) {
      setY(y - 1);
      setM(11);
    } else setM(m - 1);
  };
  const nextM = () => {
    const n = new Date();
    if (y > n.getFullYear() || (y === n.getFullYear() && m >= n.getMonth())) return;
    setSelectedDate(null);
    if (m === 11) {
      setY(y + 1);
      setM(0);
    } else setM(m + 1);
  };

  const streak = (() => {
    let n = 0;
    const d = new Date();
    while (moodLog[dateKey(d)]) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  })();

  const selectedMood = selectedDate ? moodLog[selectedDate] : null;
  const selectedEmo = selectedMood ? EMOTIONS.find((e) => e.label === selectedMood) : null;
  const selectedSummary = selectedDate ? monthSummaries[selectedDate] : null;
  const formatSelectedDate = (k) => {
    if (!k) return "";
    const [yy, mm, dd] = k.split("-");
    return `${parseInt(mm)}월 ${parseInt(dd)}일`;
  };

  return (
    <div className="up" style={{ flex: 1, padding: "48px 24px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button onClick={() => setDiaryView(false)} style={{ fontSize: 20, color: C.muted }}>
          ←
        </button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24 }}>기분 기록</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {[
          { label: "총 기록", value: total, unit: "일" },
          { label: "가장 많이", value: top[0]?.emoji || "—", unit: "", big: true },
          { label: "연속 기록", value: streak, unit: "일" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: C.surface,
              borderRadius: 14,
              padding: "16px 12px",
              border: `1px solid ${C.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: s.big ? 26 : 24, color: C.warm, lineHeight: 1.1 }}>
              {s.value}
              <span style={{ fontSize: 12 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontWeight: 300 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={prevM} style={{ fontSize: 20, color: C.muted, padding: "4px 10px" }}>‹</button>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15 }}>
            {y}년 {MONTH_KR[m]}
          </div>
          <button onClick={nextM} style={{ fontSize: 20, color: C.muted, padding: "4px 10px" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
          {DAY_KR.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, fontWeight: 300 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px 2px" }}>
          {days.map((day, i) => {
            if (!day) return <div key={i} />;
            const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const emo = EMOTIONS.find((e) => e.label === moodLog[k]);
            const isToday = k === tk;
            const isSelected = k === selectedDate;
            const hasMood = !!moodLog[k];
            const dayLogs = moodLogsByDate[k] || [];
            const hasMultiple = dayLogs.length > 1;
            return (
              <button
                key={i}
                onClick={() => hasMood && setSelectedDate(isSelected ? null : k)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "3px 1px",
                  background: isSelected ? C.warmLight : "transparent",
                  borderRadius: 8,
                  cursor: hasMood ? "pointer" : "default",
                }}
              >
                <div style={{ fontSize: 17, position: "relative" }}>
                  {emo?.emoji || ""}
                  {hasMultiple && (
                    <div style={{
                      position: "absolute",
                      top: -2,
                      right: -8,
                      background: C.warm,
                      color: "#fff",
                      fontSize: 8,
                      fontWeight: 500,
                      width: 13,
                      height: 13,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {dayLogs.length}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: isToday ? C.warm : C.sub, fontWeight: isToday ? 500 : 300 }}>{day}</div>
                {isToday && <div style={{ width: 3, height: 3, borderRadius: "50%", background: C.warm }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜 패널 */}
      {selectedDate && (
        <div className="up" style={{ background: C.surface, borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15 }}>
              {formatSelectedDate(selectedDate)}
            </div>
            <button onClick={() => setSelectedDate(null)} style={{ fontSize: 16, color: C.muted, padding: 4 }}>✕</button>
          </div>

          {/* 그날 기분 흐름 */}
          {(() => {
            const dayLogs = moodLogsByDate[selectedDate] || [];
            if (dayLogs.length === 0 && selectedMood) {
              // localStorage에서 들어와서 byDate 없는 케이스 — 마지막 mood만 표시
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{selectedEmo?.emoji || ""}</span>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 300 }}>{selectedMood}</div>
                </div>
              );
            }
            return (
              <div style={{ paddingBottom: 12, borderBottom: `1px solid ${C.border}`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 10 }}>
                  {dayLogs.length > 1 ? `${dayLogs.length}번 기록` : "기록"}
                </div>
                {dayLogs.map((log, idx) => {
                  const emo = EMOTIONS.find((e) => e.label === log.label);
                  const t = new Date(log.time);
                  const hh = String(t.getHours()).padStart(2, "0");
                  const mm = String(t.getMinutes()).padStart(2, "0");
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, width: 40 }}>{hh}:{mm}</div>
                      <span style={{ fontSize: 18 }}>{emo?.emoji || ""}</span>
                      <div style={{ fontSize: 12, color: C.sub, fontWeight: 300 }}>{log.label}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 그날 정리 */}
          {selectedSummary ? (
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
              {selectedSummary}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 300 }}>
              이 날의 정리는 아직 없어요.
            </div>
          )}
        </div>
      )}

      {top.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 15, marginBottom: 14 }}>감정 분포</div>
          {top.slice(0, 6).map((e) => (
            <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16, width: 22 }}>{e.emoji}</span>
              <span style={{ fontSize: 12, color: C.sub, width: 54, fontWeight: 300 }}>{e.label}</span>
              <div style={{ flex: 1, height: 6, background: C.card, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", background: e.color, width: `${(e.count / total) * 100}%`, borderRadius: 3, transition: "width .5s" }} />
              </div>
              <span style={{ fontSize: 11, color: C.muted, width: 16, textAlign: "right" }}>{e.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
