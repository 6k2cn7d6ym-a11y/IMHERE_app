import { C } from "../../lib/constants";
import { usePrograms, formatStartDate, splitProgramsByGu } from "../../utils/programs";

// 프로그램 카드 한 장
function ProgramCard({ program }) {
  const { title, startDate, link } = program;
  const dateLabel = formatStartDate(startDate);
  const hasLink = !!link;

  const handleClick = () => {
    if (hasLink) window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={hasLink ? handleClick : undefined}
      style={{
        background: C.surface,
        borderRadius: 14,
        padding: "16px 18px",
        border: `1px solid ${C.border}`,
        cursor: hasLink ? "pointer" : "default",
        transition: "transform .15s, box-shadow .15s",
      }}
      onMouseEnter={
        hasLink
          ? (e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(26,16,10,.06)";
            }
          : undefined
      }
      onMouseLeave={
        hasLink
          ? (e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "";
            }
          : undefined
      }
    >
      <div style={{ fontSize: 14, fontWeight: 400, color: C.text, lineHeight: 1.5, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: C.sub, fontWeight: 300 }}>
        <span>📅 {dateLabel}</span>
        {!hasLink && <span style={{ color: C.muted, fontSize: 10 }}>· 신청 정보가 없어요</span>}
        {hasLink && <span style={{ marginLeft: "auto", color: C.warm, fontSize: 11 }}>신청하기 →</span>}
      </div>
    </div>
  );
}

export default function NeighborhoodTab({ userGu, openGuModal }) {
  const { programs, loading, error, retry } = usePrograms(userGu);

  // 자치구 미설정
  if (!userGu) {
    return (
      <div style={{ flex: 1, padding: "32px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.warmLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 20 }}>📍</div>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 18, marginBottom: 10, textAlign: "center" }}>
          자치구를 먼저 설정해주세요
        </div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.7, textAlign: "center", marginBottom: 24 }}>
          우리 동네 마음챙김 프로그램을<br />보여드릴게요.
        </div>
        <button onClick={openGuModal} style={{ background: C.warm, color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14 }}>
          자치구 설정하기
        </button>
      </div>
    );
  }

  // 로딩
  if (loading) {
    return (
      <div style={{ flex: 1, padding: "32px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${C.border}`, borderTopColor: C.warm, borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 20 }} />
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 300 }}>프로그램을 불러오고 있어요...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div style={{ flex: 1, padding: "32px 26px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 18 }}>📡</div>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17, marginBottom: 8, textAlign: "center" }}>
          지금 정보를 불러올 수 없어요
        </div>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7, textAlign: "center", marginBottom: 20 }}>
          잠시 후 다시 시도해주세요.
        </div>
        <button onClick={retry} style={{ background: C.warm, color: "#fff", padding: "10px 22px", borderRadius: 8, fontSize: 13 }}>
          다시 시도
        </button>
      </div>
    );
  }

  // 성공
  const { ours, city } = splitProgramsByGu(programs, userGu);
  const hasOurs = ours.length > 0;
  const hasCity = city.length > 0;

  return (
    <div style={{ flex: 1, padding: "24px 22px 32px" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, fontWeight: 400, marginBottom: 6 }}>
          우리 동네
        </div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 300 }}>
          {userGu}의 마음챙김 프로그램
        </div>
      </div>

      {/* 시 단위 */}
      {hasCity && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>🏙️</span>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text, letterSpacing: 0.3 }}>서울시 전체</div>
          </div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 12 }}>
            어느 동네에 살든 신청할 수 있어요
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {city.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
        </div>
      )}

      {/* 우리 자치구 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.text, letterSpacing: 0.3 }}>{userGu}</div>
        </div>

        {hasOurs ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ours.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
        ) : (
          <div style={{ background: C.surface, borderRadius: 16, padding: "28px 22px", border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🌱</div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 400, lineHeight: 1.7, marginBottom: 6 }}>
              {hasCity ? `${userGu}에 등록된 프로그램은 아직 없어요.` : "이 동네에는 아직 등록된 프로그램이 없어요."}
            </div>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7, marginBottom: hasCity ? 0 : 16 }}>
              {hasCity
                ? "위의 서울시 전체 프로그램은 누구나 신청할 수 있어요."
                : "다른 동네도 둘러보시겠어요?"}
            </div>
            {!hasCity && (
              <button onClick={openGuModal} style={{ background: C.warm, color: "#fff", padding: "10px 22px", borderRadius: 8, fontSize: 13 }}>
                다른 동네 보기 →
              </button>
            )}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 300, textAlign: "center", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
        출처: 서울시 1인가구 참여프로그램
      </div>
    </div>
  );
}
