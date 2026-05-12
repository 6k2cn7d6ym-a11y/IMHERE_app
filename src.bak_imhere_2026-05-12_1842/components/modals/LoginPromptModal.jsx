import { C } from "../../lib/constants";

// 로그인 유도 모달 (게스트 액션 시 띄움)
// "회원가입하고 시작하기" / "이미 계정 있으세요? 로그인" 분리
export default function LoginPromptModal({ onClose, onSignupStart, onLoginStart }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(26,16,10,0.5)",
        zIndex: 300,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: C.bg,
          borderRadius: "20px 20px 0 0",
          padding: "28px 24px 32px",
          animation: "up .3s ease forwards",
        }}
      >
        <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: "0 auto 24px" }} />
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 20, fontWeight: 400, lineHeight: 1.4, marginBottom: 8, textAlign: "center" }}>
          로그인하고 시작해요
        </div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, fontWeight: 300, textAlign: "center", marginBottom: 28 }}>
          기분 기록과 대화는<br />
          로그인한 분만 이용하실 수 있어요.
        </div>
        <button
          onClick={onSignupStart}
          style={{
            width: "100%",
            background: C.warm,
            color: "#fff",
            padding: "15px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          회원가입하고 시작하기 →
        </button>
        <button
          onClick={onLoginStart}
          style={{ width: "100%", padding: "12px", fontSize: 13, color: C.muted, fontWeight: 300 }}
        >
          이미 계정 있으세요? 로그인
        </button>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "10px", fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 4 }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
