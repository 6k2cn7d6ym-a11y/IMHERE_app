import { C } from "../../lib/constants";
import ProgressBar from "../../components/shared/ProgressBar";

export default function NicknameSetup({ nickname, setNickname, next }) {
  const examples = ["혼자살이중", "자취 3년차", "서울토박이", "새벽감성"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <ProgressBar step={1} total={3} />

      <div style={{ flex: 1, padding: "40px 28px 0" }}>
        <div className="up" style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 26, fontWeight: 400, lineHeight: 1.4, marginBottom: 8 }}>
          뭐라고 불러드릴까요?
        </div>
        <div className="up" style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 36 }}>
          피드에서 사용할 닉네임이에요. 언제든 바꿀 수 있어요.
        </div>

        <div className="up" style={{ background: C.surface, borderRadius: 14, border: `1px solid ${nickname ? C.warm : C.border}`, padding: "16px 20px", marginBottom: 16, transition: "border .2s" }}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 12))}
            placeholder="닉네임 입력 (최대 12자)"
            style={{ width: "100%", border: "none", background: "transparent", fontSize: 16, color: C.text, fontWeight: 300 }}
          />
        </div>

        <div style={{ fontSize: 11, color: C.muted, marginBottom: 24, fontWeight: 300 }}>
          이런 닉네임은 어떠세요?
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {examples.map((e) => (
            <button
              key={e}
              onClick={() => setNickname(e)}
              style={{ padding: "8px 16px", borderRadius: 40, fontSize: 12, border: `1px solid ${C.border}`, color: C.sub, background: C.surface, fontWeight: 300 }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "32px 28px 52px" }}>
        <button
          onClick={next}
          disabled={!nickname.trim()}
          style={{
            width: "100%",
            background: nickname.trim() ? C.dark : C.border,
            color: "#fff",
            padding: "17px",
            borderRadius: 8,
            fontSize: 15,
            letterSpacing: 0.3,
            transition: "background .2s",
            cursor: nickname.trim() ? "pointer" : "default",
          }}
        >
          좋아요, 이걸로 할게요 →
        </button>
      </div>
    </div>
  );
}
