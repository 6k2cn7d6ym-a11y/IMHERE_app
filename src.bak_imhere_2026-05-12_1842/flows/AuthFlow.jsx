import { useState } from "react";
import { C } from "../lib/constants";
import { supabase } from "../lib/supabase";

// 인증 흐름 - 로그인 또는 회원가입 단순 화면
// mode: "login" | "signup"
// 가입 시 동의 체크박스 강제 (소셜 로그인도)
export default function AuthFlow({ mode: initialMode, onCancel }) {
  const [mode, setMode] = useState(initialMode); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState({ ai: false, privacy: false, terms: false, records: false });

  const allAgreed = agreed.ai && agreed.privacy && agreed.terms && agreed.records;
  const canProceed = mode === "login" || allAgreed;

  const toggle = (key) => setAgreed((a) => ({ ...a, [key]: !a[key] }));
  const toggleAll = () => {
    const all = !allAgreed;
    setAgreed({ ai: all, privacy: all, terms: all, records: all });
  };

  const handleEmailAuth = async () => {
    if (!canProceed) {
      setError("필수 항목에 동의해주세요");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fn =
        mode === "login"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password });
      const { error: err } = await fn;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      // 성공 — 페이지 새로고침으로 확실하게 라우팅
      window.location.reload();
    } catch (e) {
      setError(e.message || "다시 시도해주세요");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!canProceed) {
      setError("필수 항목에 동의해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
      }
    } catch (e) {
      setError(e.message || "다시 시도해주세요");
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    if (!canProceed) {
      setError("필수 항목에 동의해주세요");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: window.location.origin },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
      }
    } catch (e) {
      setError(e.message || "다시 시도해주세요");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::placeholder { color:${C.muted}; }
        input:focus { outline:none; }
        ::-webkit-scrollbar { width:0; }
        button { cursor:pointer; border:none; background:none; font-family:inherit; }
        @keyframes up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .up { animation: up .4s ease forwards; }
      `}</style>

      {/* 좌측 상단 닫기 버튼 */}
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 100 }}>
        <button
          onClick={onCancel}
          style={{
            fontSize: 18,
            color: C.sub,
            padding: 8,
            background: "rgba(248,244,239,.7)",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="돌아가기"
        >
          ←
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 28px 40px" }}>
          {/* 헤더 */}
          <div className="up" style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 20px" }}>
              🌿
            </div>
            <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, fontWeight: 400, marginBottom: 8 }}>
              {mode === "login" ? "로그인" : "회원가입"}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontWeight: 300, lineHeight: 1.7 }}>
              {mode === "login"
                ? "오롯에 다시 오신 걸 환영해요"
                : "오롯에 오신 걸 환영해요"}
            </div>
          </div>

          {/* 이메일/비번 */}
          <div className="up" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              autoComplete="email"
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", fontSize: 14, color: C.text }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "비밀번호 (6자 이상)" : "비밀번호"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", fontSize: 14, color: C.text }}
            />
          </div>

          {/* 동의 체크박스 - 회원가입 모드에서만 */}
          {mode === "signup" && (
            <div style={{ marginBottom: 16 }}>
              {/* 전체 동의 */}
              <div
                onClick={toggleAll}
                style={{
                  background: allAgreed ? C.dark : C.surface,
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: `1px solid ${allAgreed ? C.dark : C.border}`,
                  marginBottom: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${allAgreed ? "#fff" : C.muted}`,
                    background: allAgreed ? "#fff" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {allAgreed && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.dark }} />}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: allAgreed ? "#fff" : C.text }}>전체 동의하기</div>
              </div>

              {/* 개별 동의 */}
              {[
                { key: "terms", label: "이용약관 동의 (필수)" },
                { key: "privacy", label: "개인정보 수집·이용 동의 (필수)" },
                { key: "ai", label: "AI 대화 사용 동의 (필수)" },
                { key: "records", label: "내 기록 저장 동의 (필수)" },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggle(item.key)}
                  style={{
                    padding: "8px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `1.5px solid ${agreed[item.key] ? C.warm : C.muted}`,
                      background: agreed[item.key] ? C.warm : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {agreed[item.key] && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, fontWeight: 300 }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div style={{ fontSize: 12, color: "#C44545", marginBottom: 12, textAlign: "center", fontWeight: 300 }}>
              {error}
            </div>
          )}

          {/* 메인 버튼 */}
          <button
            onClick={handleEmailAuth}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? C.muted : canProceed ? C.dark : C.border,
              color: "#fff",
              padding: "15px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 10,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
          </button>

          {/* 모드 전환 */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              style={{ fontSize: 12, color: C.sub, fontWeight: 300, textDecoration: "underline" }}
            >
              {mode === "login" ? "처음이세요? 회원가입" : "이미 계정 있으세요? 로그인"}
            </button>
          </div>

          {/* 구분선 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>또는</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {/* 소셜 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{
                width: "100%",
                background: C.surface,
                color: C.text,
                border: `1px solid ${C.border}`,
                padding: "14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: loading ? "default" : "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Google로 계속
            </button>

            <button
              onClick={handleAppleAuth}
              disabled={loading}
              style={{
                width: "100%",
                background: "#000",
                color: "#fff",
                border: `1px solid #000`,
                padding: "14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: loading ? "default" : "pointer",
              }}
            >
              <span style={{ fontSize: 16 }}></span>
              Apple로 계속
            </button>

            <button
              disabled
              style={{
                width: "100%",
                background: C.surface,
                color: C.muted,
                border: `1px solid ${C.border}`,
                padding: "14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 400,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              <span style={{ fontSize: 16 }}>💬</span>
              카카오로 계속
              <span style={{ fontSize: 10, marginLeft: 4 }}>(준비 중)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
