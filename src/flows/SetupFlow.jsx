import { useState } from "react";
import { C } from "../lib/constants";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";
import NicknameSetup from "./steps/NicknameSetup";
import GuSetup from "./steps/GuSetup";
import FirstMoodCheck from "./steps/FirstMoodCheck";
import Complete from "./steps/Complete";
import WelcomeSlides from "./steps/WelcomeSlides";

// 프로필 셋업 흐름 (회원가입 후 첫 로그인 시)
// 0=슬라이드 → 1=닉네임 → 2=자치구 → 3=첫 기분 → 완료
export default function SetupFlow({ onComplete }) {
  const { user, profile, refreshProfile } = useAuth();

  // 시작 step 자동 계산 (mount 시 1회)
  // - 슬라이드 본 적 없음 → 0 (슬라이드부터)
  // - 닉네임 비어있음 → 1 (닉네임)
  // - 자치구 비어있음 → 2 (자치구)
  // - 둘 다 있으면 → 3 (첫 기분)
  const computeInitialStep = () => {
    let slidesSeen = false;
    try { slidesSeen = localStorage.getItem("orot_slides_seen") === "1"; } catch {}
    if (!slidesSeen) return 0;
    if (!profile?.nickname) return 1;
    if (!profile?.gu) return 2;
    return 3;
  };

  const [step, setStep] = useState(computeInitialStep);
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [selectedGu, setSelectedGu] = useState(profile?.gu || null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const next = async () => {
    if (saving) return;

    // step 1 (닉네임) → 2 가기 전 DB 저장
    if (step === 1 && nickname.trim()) {
      setSaving(true);
      try {
        if (user) {
          await supabase.from("profiles").update({ nickname: nickname.trim() }).eq("id", user.id);
        }
      } catch (e) {
        console.error("닉네임 저장 실패:", e);
      } finally {
        setSaving(false);
      }
    }

    // step 2 (자치구) → 3 가기 전 DB 저장
    if (step === 2 && selectedGu) {
      setSaving(true);
      try {
        if (user) {
          await supabase.from("profiles").update({ gu: selectedGu }).eq("id", user.id);
          try { localStorage.setItem("orot_user_gu", selectedGu); } catch {}
        }
      } catch (e) {
        console.error("자치구 저장 실패:", e);
      } finally {
        setSaving(false);
      }
    }

    setStep((s) => s + 1);
  };

  // setup 완료 시 AuthContext의 profile 갱신 후 onComplete
  const handleComplete = async () => {
    await refreshProfile();
    onComplete();
  };

  if (done) return <Complete nickname={nickname} mood={selectedMood} gu={selectedGu} onStart={handleComplete} />;

  // step 0 = 슬라이드 (자체 레이아웃) — 한 번 보면 localStorage 박아서 다시 안 보임
  if (step === 0) {
    return <WelcomeSlides onComplete={() => {
      try { localStorage.setItem("orot_slides_seen", "1"); } catch {}
      // 슬라이드 끝났을 때 profile에 이미 nickname/gu가 있으면 그 step으로 jump
      if (!profile?.nickname) setStep(1);
      else if (!profile?.gu) setStep(2);
      else setStep(3);
    }} />;
  }

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
        @keyframes fadein { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        .up { animation: up .4s ease forwards; }
        .fade { animation: fadein .5s ease forwards; }
        .emo { transition: transform .12s; }
        .emo:active { transform: scale(.92); }
        input[type=text] { outline:none; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {step === 1 && <NicknameSetup nickname={nickname} setNickname={setNickname} next={next} />}
        {step === 2 && <GuSetup selectedGu={selectedGu} setSelectedGu={setSelectedGu} next={next} />}
        {step === 3 && <FirstMoodCheck selectedMood={selectedMood} setSelectedMood={setSelectedMood} setDone={setDone} />}
      </div>
    </div>
  );
}
