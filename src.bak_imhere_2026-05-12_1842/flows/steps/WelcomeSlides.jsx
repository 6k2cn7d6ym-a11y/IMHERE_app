import { useState } from "react";
import { C } from "../../lib/constants";

const SLIDES = [
  {
    emoji: "🌿",
    title: "오롯이 삶을 꾸리고 있는",
    titleHighlight: "당신의 마음을 돌봐주세요",
    desc: null,
  },
  {
    emoji: "💬",
    title: "오로시와",
    titleHighlight: "마음 나눠요",
    desc: "어떤 말이든 들려주세요",
  },
  {
    emoji: "📍",
    title: "동네 자원이",
    titleHighlight: "한 곳에",
    desc: "우리 동네 마음챙김 프로그램 정보를 모아드려요",
  },
  {
    emoji: "🌟",
    title: "거의 다 됐어요",
    titleHighlight: null,
    desc: "닉네임과 동네만 알려주세요",
  },
];

export default function WelcomeSlides({ onComplete }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const next = () => {
    if (isLast) onComplete();
    else setIdx((i) => i + 1);
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
        button { cursor:pointer; border:none; background:none; font-family:inherit; }
        @keyframes fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadein .5s ease forwards; }
      `}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* 슬라이드 콘텐츠 */}
        <div
          key={idx}
          className="fade"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: C.warmLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              marginBottom: 36,
            }}
          >
            {slide.emoji}
          </div>

          <div
            style={{
              fontFamily: "'Noto Serif KR',serif",
              fontSize: 24,
              fontWeight: 400,
              lineHeight: 1.5,
              marginBottom: slide.desc ? 16 : 0,
              maxWidth: 320,
            }}
          >
            {slide.title}
            {slide.titleHighlight && (
              <>
                <br />
                <span style={{ color: C.warm }}>{slide.titleHighlight}</span>
              </>
            )}
          </div>

          {slide.desc && (
            <div style={{ fontSize: 14, color: C.sub, fontWeight: 300, lineHeight: 1.7, maxWidth: 320 }}>
              {slide.desc}
            </div>
          )}
        </div>

        {/* 인디케이터 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "0 0 24px" }}>
          {SLIDES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === idx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === idx ? C.warm : C.border,
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>

        {/* 버튼 */}
        <div style={{ padding: "0 28px 52px" }}>
          <button
            onClick={next}
            style={{
              width: "100%",
              background: C.dark,
              color: "#fff",
              padding: "17px",
              borderRadius: 8,
              fontSize: 15,
              letterSpacing: 0.3,
            }}
          >
            {isLast ? "시작하기 →" : "다음 →"}
          </button>
          {!isLast && (
            <button
              onClick={onComplete}
              style={{ width: "100%", padding: "12px", marginTop: 8, fontSize: 12, color: C.muted, fontWeight: 300 }}
            >
              건너뛰기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
