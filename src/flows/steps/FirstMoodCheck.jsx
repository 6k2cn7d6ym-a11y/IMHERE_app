import { useState } from "react";
import { C, ONBOARDING_EMOTIONS } from "../../lib/constants";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { todayKey } from "../../utils/date";

export default function FirstMoodCheck({ selectedMood, setSelectedMood, setDone }) {
  const emotion = ONBOARDING_EMOTIONS.find((e) => e.label === selectedMood);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const startApp = async () => {
    if (saving) return;
    if (selectedMood) {
      setSaving(true);
      try {
        if (user) {
          await supabase.from("mood_logs").insert({
            user_id: user.id,
            date: todayKey(),
            mood_label: selectedMood,
          });
        }
      } catch (e) {
        console.error("첫 기분 저장 실패:", e);
      } finally {
        setSaving(false);
      }
    }
    setDone(true);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "52px 28px 0" }}>
        <div className="up" style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 26, fontWeight: 400, lineHeight: 1.4, marginBottom: 8 }}>
          마지막으로,<br />지금 기분은 어떠세요?
        </div>
        <div className="up" style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 36 }}>
          솔직하게 골라주세요. 여기선 다 괜찮아요.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
          {ONBOARDING_EMOTIONS.map((e) => (
            <button
              key={e.label}
              className="emo"
              onClick={() => setSelectedMood(e.label)}
              style={{ width: "calc(25% - 9px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background: selectedMood === e.label ? e.color + "88" : C.surface,
                  border: `2px solid ${selectedMood === e.label ? e.color : C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  boxShadow: selectedMood === e.label ? `0 4px 16px ${e.color}66` : "0 2px 8px rgba(26,16,10,.05)",
                  transition: "all .2s",
                }}
              >
                {e.emoji}
              </div>
              <span style={{ fontSize: 10, color: selectedMood === e.label ? C.warm : C.muted, fontWeight: selectedMood === e.label ? 500 : 300 }}>
                {e.label}
              </span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div
            className="up"
            style={{
              marginTop: 24,
              background: emotion ? emotion.color + "33" : C.card,
              borderRadius: 14,
              padding: "16px 18px",
              border: `1px solid ${emotion ? emotion.color + "66" : C.border}`,
            }}
          >
            <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.75, fontWeight: 300 }}>
              {selectedMood === "힘들어요" && "많이 힘드셨겠어요. 들려주세요 🤍"}
              {selectedMood === "외로워요" && "외로운 날이군요. 여기 있을게요."}
              {selectedMood === "불안해요" && "불안한 마음이시군요. 같이 이야기해봐요."}
              {selectedMood === "짜증나요" && "뭔가 쌓인 게 있으신가봐요. 다 말씀하셔도 돼요."}
              {selectedMood === "피곤해요" && "많이 지치셨군요. 오늘은 그냥 쉬셔도 괜찮아요."}
              {selectedMood === "괜찮아요" && "오늘 좋은 날이네요 😊 무슨 일 있으셨어요?"}
              {selectedMood === "평온해요" && "그 평온함 소중히 여기세요. 잘 하고 계세요."}
              {selectedMood === "설레요" && "뭔가 좋은 일 있으셨군요! 들려주세요"}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "28px 28px 52px" }}>
        <button
          onClick={startApp}
          disabled={!selectedMood || saving}
          style={{
            width: "100%",
            background: selectedMood ? C.warm : C.border,
            color: "#fff",
            padding: "17px",
            borderRadius: 8,
            fontSize: 15,
            letterSpacing: 0.3,
            transition: "background .2s",
            cursor: selectedMood ? "pointer" : "default",
          }}
        >
          {selectedMood ? "오롯 시작하기 →" : "기분을 골라주세요"}
        </button>
        <button
          onClick={() => setDone(true)}
          style={{ width: "100%", marginTop: 12, padding: "12px", fontSize: 13, color: C.muted, fontWeight: 300 }}
        >
          나중에 할게요
        </button>
      </div>
    </div>
  );
}
