import { C, ONBOARDING_EMOTIONS } from "../../lib/constants";

export default function Complete({ nickname, mood, gu, onStart }) {
  const emotion = ONBOARDING_EMOTIONS.find((e) => e.label === mood);

  return (
    <div
      className="fade"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 28px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: emotion ? emotion.color + "66" : C.warmLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
          marginBottom: 24,
          boxShadow: emotion ? `0 8px 24px ${emotion.color}66` : "none",
        }}
      >
        🌿
      </div>
      <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 26, fontWeight: 400, marginBottom: 10, lineHeight: 1.4 }}>
        반가워요, {nickname || "친구"} 😊
      </div>
      {gu && (
        <div style={{ fontSize: 12, color: C.warm, fontWeight: 400, marginBottom: 18, letterSpacing: 0.5 }}>
          📍 {gu}
        </div>
      )}
      <div style={{ fontSize: 14, color: C.sub, fontWeight: 300, lineHeight: 1.8, marginBottom: 48 }}>
        오롯이 너의 자리예요.<br />
        힘드실 때, 외로우실 때, 그냥 말하고 싶으실 때<br />
        언제든 오세요.
      </div>
      <button
        onClick={onStart}
        style={{ width: "100%", maxWidth: 360, background: C.dark, color: "#fff", padding: "17px", borderRadius: 8, fontSize: 15, letterSpacing: 0.3 }}
      >
        시작하기 →
      </button>
    </div>
  );
}
