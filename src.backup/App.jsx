import { useState, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";

const C = {
  bg: "#F8F4EF",
  surface: "#FFFFFF",
  card: "#F2EDE5",
  warm: "#9B5E45",
  warmLight: "#E5CDB8",
  text: "#1A100A",
  sub: "#7A6055",
  muted: "#B5A49A",
  border: "#E8DDD5",
  dark: "#1A100A",
};

const NEGATIVE = ["힘들어요","외로워요","불안해요","짜증나요","피곤해요","공허해요","복잡해요"];
const POSITIVE  = ["괜찮아요","평온해요","뭉클해요","설레요","뿌듯해요"];

const EMOTIONS = [
  { emoji:"🌤", label:"괜찮아요", color:"#F5D98E" },
  { emoji:"😌", label:"평온해요", color:"#B8D4BE" },
  { emoji:"🥹", label:"뭉클해요", color:"#D4C4E8" },
  { emoji:"🌸", label:"설레요",   color:"#F5C4D0" },
  { emoji:"💪", label:"뿌듯해요", color:"#C4D4B8" },
  { emoji:"😔", label:"힘들어요", color:"#B8C4D8" },
  { emoji:"😢", label:"외로워요", color:"#C4D0E8" },
  { emoji:"😰", label:"불안해요", color:"#E8D8B8" },
  { emoji:"😤", label:"짜증나요", color:"#D8B8B8" },
  { emoji:"🥱", label:"피곤해요", color:"#D4CCB8" },
  { emoji:"😶", label:"공허해요", color:"#C8C8D4" },
  { emoji:"🤯", label:"복잡해요", color:"#C4B8D4" },
];

const POSITIVE_PROMPTS = [
  "오늘 기분 좋아 보이세요 😊 무슨 좋은 일 있으셨어요?",
  "뭔가 좋은 일 있으셨군요! 들려주세요",
  "오늘 에너지 넘치시는데요? ✨ 어떤 일이세요?",
  "기분 좋은 날엔 그 이유 기록해두면 나중에 힘이 돼요. 오늘 뭐가 좋으셨어요?",
];

const MOOD_MSGS = {
  "힘들어요": "많이 힘드셨겠어요. 혼자 담아두지 말고 들려주세요.",
  "외로워요": "혼자라 외로운 날이군요. 여기 있을게요.",
  "불안해요": "불안한 마음이 드셨군요. 어떤 게 걱정이세요?",
  "짜증나요": "뭔가 쌓인 게 있으신가봐요. 다 말씀하셔도 돼요.",
  "피곤해요": "많이 지치셨군요. 오늘은 그냥 쉬셔도 괜찮아요.",
  "공허해요": "텅 빈 느낌이 드셨군요. 같이 이야기해봐요.",
  "복잡해요": "복잡한 마음이시군요. 하나씩 들려주세요.",
};

const FEED_POSTS = [
  { id:1, user:"자취 3년차", emoji:"🌿", time:"2시간 전", content:"냉장고가 비어있는 날이 제일 무서움. 근데 요즘은 그게 오히려 장보러 나가는 이유가 됨 ㅋㅋ 작은 루틴이 생겼어요.", likes:48, saved:12, liked:false, savedByMe:false, tag:"일상" },
  { id:2, user:"서울 혼살이", emoji:"🏙", time:"5시간 전", content:"다이소 욕실 선반 진짜 인생템이에요. 3,000원짜리가 이렇게 삶의 질을 올릴 줄은 몰랐음 😂", likes:134, saved:67, liked:false, savedByMe:false, tag:"꿀팁" },
  { id:3, user:"1인가구 2년", emoji:"🌙", time:"어제", content:"퇴근하고 집에 오면 아무도 없다는 게 처음엔 너무 쓸쓸했는데 이제는 내 공간이 생겼다는 게 얼마나 소중한지 알 것 같아요.", likes:312, saved:89, liked:false, savedByMe:false, tag:"감성" },
  { id:4, user:"꿀팁러", emoji:"✨", time:"어제", content:"에어컨 필터 한 달에 한 번 청소하면 전기세 10~15% 줄어요. 진짜임. 지난달에 확인했어요.", likes:201, saved:145, liked:false, savedByMe:false, tag:"꿀팁" },
  { id:5, user:"새벽 감성", emoji:"🌃", time:"2일 전", content:"새벽 2시에 혼자 라면 끓여 먹는 거, 누군가한테는 외로운 일이겠지만 저한테는 나만의 소소한 행복이에요.", likes:567, saved:234, liked:false, savedByMe:false, tag:"감성" },
];

const DAY_KR = ["일","월","화","수","목","금","토"];
const MONTH_KR = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

// 서울시 25개 자치구
const GU_LIST = [
  "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
  "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구",
  "성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"
];

// 자치구별 1인가구 지원센터 (3개월에 한 번 갱신 예정)
// 출처: 사용자 직접 모집 (씽글벙글 서울 + 자치구청)
// admin_connected: 자치구 admin 시스템과 부여번호 연결 여부 (운영 중 자치구별 활성화)
const GU_CENTERS = {
  "강남구": { name: "강남구청 사회보장과", phone: "02-3423-5874", admin_connected: false },
  "강동구": { name: "강동구 1인가구지원센터", phone: "02-479-1179", admin_connected: false },
  "강북구": { name: null, phone: null, admin_connected: false },
  "강서구": { name: "강서구 가족센터", phone: "02-2606-2017", admin_connected: false },
  "관악구": { name: "관악구청 복지정책과", phone: "02-879-5841", admin_connected: false },
  "광진구": { name: "광진구청 복지정책과", phone: "02-450-7305", admin_connected: false },
  "구로구": { name: "구로구청 통합돌봄과", phone: "02-860-5445", admin_connected: false },
  "금천구": { name: "금천구청 복지정책과", phone: "02-2627-1004", admin_connected: false },
  "노원구": { name: "노원구청 복지정책과", phone: "02-2116-3676", admin_connected: false },
  "도봉구": { name: "도봉구 가족센터 2관", phone: "02-995-6800", admin_connected: false },
  "동대문구": { name: "동대문구 1인가구 지원센터", phone: "010-7459-3301", admin_connected: false },
  "동작구": { name: "동작구청 복지정책과", phone: "02-820-9046", admin_connected: false },
  "마포구": { name: "마포구 가족센터", phone: "070-7467-0790", admin_connected: false },
  "서대문구": { name: "서대문구 1인가구지원센터", phone: "070-4108-9160", admin_connected: false },
  "서초구": { name: "서초구 1인가구지원센터", phone: "02-2155-8977", admin_connected: false },
  "성동구": { name: "성동구 1인가구지원센터", phone: "02-2281-7715", admin_connected: false },
  "성북구": { name: "성북복지재단 1인가구 지원센터", phone: "070-4271-5490", admin_connected: false },
  "송파구": { name: "송파구 가족센터", phone: "070-7450-4331", admin_connected: false },
  "양천구": { name: "양천구 가족센터", phone: "070-7433-3422", admin_connected: false },
  "영등포구": { name: "영등포구 1인가구지원센터", phone: "02-846-5432", admin_connected: false },
  "용산구": { name: "용산구 가족센터", phone: "02-797-9184", admin_connected: false },
  "은평구": { name: "은평구 1인가구지원센터", phone: "070-7492-7901", admin_connected: false },
  "종로구": { name: null, phone: null, admin_connected: false },
  "중구": { name: "중구 1인가구지원센터", phone: "02-6953-1299", admin_connected: false },
  "중랑구": { name: "중랑구청 복지정책과", phone: "02-2094-1622", admin_connected: false },
};

// ───────── 우리 동네: 마음챙김 프로그램 (서울시 열린데이터광장 API) ─────────

// 서울시 열린데이터광장 인증키 (공공 API라 클라이언트 노출 가능)
// data.seoul.go.kr 마이페이지 > 인증키 관리에서 발급
const OPENAPI_KEY = "686752756c6b6a6939365446737952";
const OPENAPI_SERVICE = "tbPartcptn"; // 1인가구 참여프로그램 현황
const CACHE_KEY = "orot:programs:v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

// 정서 매칭 키워드 (외로움 카테고리는 무조건 통과, 기타 카테고리는 키워드로)
const EMOTION_KEYWORDS = [
  "마음","심리","정서","감정","자존","자기이해","자기돌봄",
  "우울","불안","스트레스","외롭","고립","정신건강","마음건강",
  "명상","힐링","치유","위로","공감","토닥","다독",
  "쉼","휴식","안식","안녕","돌봄",
  "관계","소통","교류","친구","대인","동행","모임",
  "친교","어울림","사귐","혼자","혼밥","혼술","1인생활","네트워크",
  "상담","멘토",
  "미술","그림","음악","예술","영화","글쓰기","일기",
  "산책","걷기","독서","북클럽","책",
];

// 한 행이 정서 카테고리인지
function matchEmotion(row) {
  if (row.SE_NM === "외로움") return true;
  if (row.SE_NM !== "기타") return false;
  const title = row.PARTCPTN_SJ || "";
  return EMOTION_KEYWORDS.some((k) => title.includes(k));
}

// 종료일이 오늘 이후 (활성)
function isActive(row) {
  const end = row.PROGRS_DE2;
  if (!end) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  return end >= todayStr;
}

// API row → 앱 내부 형태로 변환
function normalizeRow(row) {
  return {
    id: row.PARTCPTN_ID,
    gu: row.ATDRC_NM,
    title: (row.PARTCPTN_SJ || "").trim(),
    startDate: row.PROGRS_DE1 || null,
    endDate: row.PROGRS_DE2 || null,
    link: row.RCEPT_MTH_LINK || null,
  };
}

// 페이지네이션 fetch (1000건씩)
async function fetchProgramsPage(start, end) {
  const url = `http://openapi.seoul.go.kr:8088/${OPENAPI_KEY}/json/${OPENAPI_SERVICE}/${start}/${end}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  // 응답 구조: { tbPartcptn: { list_total_count, RESULT, row: [...] } }
  // 또는 키 에러 시: { RESULT: { CODE, MESSAGE } }
  if (json.RESULT && json.RESULT.CODE && json.RESULT.CODE !== "INFO-000") {
    throw new Error(`API: ${json.RESULT.MESSAGE || json.RESULT.CODE}`);
  }
  const payload = json[OPENAPI_SERVICE];
  if (!payload) throw new Error("API 응답 형식 오류");
  if (payload.RESULT && payload.RESULT.CODE !== "INFO-000") {
    throw new Error(`API: ${payload.RESULT.MESSAGE || payload.RESULT.CODE}`);
  }
  return {
    total: payload.list_total_count || 0,
    rows: payload.row || [],
  };
}

// 전체 가져와서 정제
async function fetchAllPrograms() {
  const PAGE_SIZE = 1000;
  const first = await fetchProgramsPage(1, PAGE_SIZE);
  let allRows = first.rows;
  const total = first.total;
  if (total > PAGE_SIZE) {
    const remainingPages = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE);
    for (let i = 0; i < remainingPages; i++) {
      const s = PAGE_SIZE * (i + 1) + 1;
      const e = Math.min(PAGE_SIZE * (i + 2), total);
      const page = await fetchProgramsPage(s, e);
      allRows = allRows.concat(page.rows);
    }
  }
  // 필터 + 정규화
  return allRows
    .filter((r) => matchEmotion(r) && isActive(r))
    .map(normalizeRow);
}

// 캐시 읽기 (6시간 이내면 사용)
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.fetchedAt || !Array.isArray(parsed.programs)) return null;
    const age = Date.now() - parsed.fetchedAt;
    if (age > CACHE_TTL_MS) return null;
    return parsed.programs;
  } catch { return null; }
}

function writeCache(programs) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      fetchedAt: Date.now(),
      programs,
    }));
  } catch {}
}

// 커스텀 훅: 우리 동네 탭에서 호출
function usePrograms() {
  const [programs, setPrograms] = useState(() => readCache() || []);
  const [loading, setLoading] = useState(() => readCache() === null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (readCache() !== null) return; // 신선한 캐시 있으면 fetch 안 함
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAllPrograms()
      .then((data) => {
        if (cancelled) return;
        setPrograms(data);
        writeCache(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "불러오기 실패");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { programs, loading, error };
}

// "5월 9일 시작" / "1월 1일부터" 형태로
function formatStartDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const today = new Date();
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const isStarted = start <= today;
  const label = `${m}월 ${d}일`;
  return isStarted ? `${label}부터` : `${label} 시작`;
}

// 자치구별 + 시작일 오름차순 분리
function splitProgramsByGu(programs, gu) {
  const ours = programs
    .filter((p) => p.gu === gu)
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
  const city = programs
    .filter((p) => p.gu === "서울시")
    .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
  return { ours, city };
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function todayKey() { return dateKey(new Date()); }
function getCalendarDays(y, m) {
  const first = new Date(y, m, 1).getDay();
  const last  = new Date(y, m+1, 0).getDate();
  const days  = [];
  for (let i=0;i<first;i++) days.push(null);
  for (let i=1;i<=last;i++) days.push(i);
  return days;
}
function countConsecNegative(log) {
  let count = 0;
  const d = new Date();
  for (let i=0;i<7;i++) {
    const k = dateKey(d);
    if (log[k] && NEGATIVE.includes(log[k])) { count++; d.setDate(d.getDate()-1); }
    else break;
  }
  return count;
}

// ════════════════════════════════════════════════════════════
// 온보딩 플로우 (첫 진입 시에만)
// ════════════════════════════════════════════════════════════

function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState({ ai: false, privacy: false, terms: false });
  const [nickname, setNickname] = useState("");
  const [selectedGu, setSelectedGu] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [done, setDone] = useState(false);

  const allAgreed = agreed.ai && agreed.privacy && agreed.terms;
  const [saving, setSaving] = useState(false);

  // 단계별 진행 — 닉네임/자치구 입력 후 DB에 저장
  const next = async () => {
    if (saving) return;

    // step 5 (닉네임 입력) → 6으로 넘어가기 전 DB 저장
    if (step === 5 && nickname.trim()) {
      setSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles")
            .update({ nickname: nickname.trim() })
            .eq("id", user.id);
        }
      } catch (e) {
        console.error("닉네임 저장 실패:", e);
      } finally {
        setSaving(false);
      }
    }

    // step 6 (자치구 선택) → 7로 넘어가기 전 DB 저장
    if (step === 6 && selectedGu) {
      setSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles")
            .update({ gu: selectedGu })
            .eq("id", user.id);
        }
      } catch (e) {
        console.error("자치구 저장 실패:", e);
      } finally {
        setSaving(false);
      }
    }

    setStep(s => s + 1);
  };

  // OAuth redirect 복귀 시 자동으로 로그인 후 단계로
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        // 이미 로그인됨 = 로그인 단계(4) 건너뛰고 닉네임(5)으로
        setStep(s => Math.max(s, 5));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session) {
        setStep(s => Math.max(s, 5));
      }
    });
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  // 온보딩 완료 시 localStorage에 저장
  useEffect(() => {
    if (done && selectedGu) {
      try { localStorage.setItem("orot_user_gu", selectedGu); } catch {}
    }
    if (done && nickname) {
      try { localStorage.setItem("orot_user_nickname", nickname); } catch {}
    }
  }, [done, selectedGu, nickname]);

  if (done) return <완료화면 nickname={nickname} mood={selectedMood} gu={selectedGu} onStart={onComplete} />;

  return (
    <div style={{ fontFamily:"'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif", background:C.bg, minHeight:"100vh", color:C.text }}>
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

      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
        {step === 0 && <스플래시 next={next} />}
        {step === 1 && <오로시소개 next={next} />}
        {step === 2 && <공감포인트 next={next} />}
        {step === 3 && <고지동의 agreed={agreed} setAgreed={setAgreed} allAgreed={allAgreed} next={next} />}
        {step === 4 && <로그인 next={next} />}
        {step === 5 && <닉네임설정 nickname={nickname} setNickname={setNickname} next={next} />}
        {step === 6 && <자치구설정 selectedGu={selectedGu} setSelectedGu={setSelectedGu} next={next} />}
        {step === 7 && <첫기분체크 selectedMood={selectedMood} setSelectedMood={setSelectedMood} setDone={setDone} />}
      </div>
    </div>
  );
}

// 온보딩 전용 감정 (8개 - 메인의 MOODS와 다름)
const ONBOARDING_EMOTIONS = [
  { emoji:"🌤", label:"괜찮아요", color:"#F5D98E" },
  { emoji:"😌", label:"평온해요", color:"#B8D4BE" },
  { emoji:"🌸", label:"설레요",   color:"#F5C4D0" },
  { emoji:"😔", label:"힘들어요", color:"#B8C4D8" },
  { emoji:"😢", label:"외로워요", color:"#C4D0E8" },
  { emoji:"😰", label:"불안해요", color:"#E8D8B8" },
  { emoji:"😤", label:"짜증나요", color:"#D8B8B8" },
  { emoji:"🥱", label:"피곤해요", color:"#D4CCB8" },
];

// ── 진행 바 ──────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display:"flex", gap:4, padding:"20px 24px 0" }}>
      {Array.from({length:total}, (_,i) => (
        <div key={i} style={{ flex:1, height:2, borderRadius:2, background:i<step?C.warm:C.border, transition:"background .3s" }}/>
      ))}
    </div>
  );
}

// ── 0. 스플래시 ──────────────────────────────────────────
function 스플래시({ next }) {
  useEffect(() => {
    const t = setTimeout(next, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fade" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ animation:"pulse 2s infinite" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:C.warmLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:38 }}>
          🌿
        </div>
      </div>
      <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:28, fontWeight:400, color:C.text, letterSpacing:-.5 }}>오롯</div>
      <div style={{ fontSize:13, color:C.muted, fontWeight:300 }}>혼자, 그 자체로 풍요롭게</div>
    </div>
  );
}

// ── 1. 오로시 소개 ─────────────────────────────────────────
function 오로시소개({ next }) {
  const [bubble, setBubble] = useState(0);
  const bubbles = [
    "안녕하세요. 저는 오로시예요 🌿",
    "혼자 살면서 쌓이는 것들 있잖아요.\n말하기는 애매하고, 혼자 담기는 무거운.",
    "어떤 말이든 들려주세요.\n여기선 다 괜찮아요.",
  ];

  useEffect(() => {
    if (bubble < bubbles.length - 1) {
      const t = setTimeout(() => setBubble(b => b+1), 1400);
      return () => clearTimeout(t);
    }
  }, [bubble]);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 28px" }}>
        {/* 오로시 아바타 */}
        <div style={{ display:"flex", alignItems:"flex-end", gap:14, marginBottom:32 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:C.warmLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
            🌿
          </div>
          <div style={{ fontSize:11, color:C.muted }}>오로시</div>
        </div>

        {/* 말풍선들 */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {bubbles.map((b, i) => (
            i <= bubble && (
              <div key={i} className="up" style={{ animationDelay:`${i*.1}s`, maxWidth:"85%", background:C.surface, borderRadius:"4px 20px 20px 20px", padding:"14px 18px", boxShadow:"0 2px 12px rgba(26,16,10,.06)", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:15, color:C.text, lineHeight:1.75, fontWeight:300, whiteSpace:"pre-line" }}>{b}</div>
              </div>
            )
          ))}
        </div>
      </div>

      {bubble === bubbles.length - 1 && (
        <div className="up" style={{ padding:"0 28px 52px" }}>
          <button onClick={next} style={{ width:"100%", background:C.dark, color:"#fff", padding:"17px", borderRadius:8, fontSize:15, letterSpacing:.3 }}>
            네, 저도 그래요 →
          </button>
        </div>
      )}
    </div>
  );
}

// ── 2. 공감 포인트 ───────────────────────────────────────
function 공감포인트({ next }) {
  const points = [
    { emoji:"🌙", title:"퇴근하고 집에 오면", desc:"아무도 없는 공간이 오히려 더 외롭게 느껴지는 날" },
    { emoji:"💭", title:"말하고 싶은데", desc:"카톡 보내기엔 애매하고, 혼자 삭이기엔 너무 힘든 날" },
    { emoji:"🛁", title:"그냥 누군가 들어줬으면", desc:"판단 없이, 그냥 들어주는 사람이 필요한 날" },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      <ProgressBar step={1} total={4} />

      <div style={{ flex:1, padding:"40px 28px 0" }}>
        <div className="up" style={{ fontFamily:"'Noto Serif KR',serif", fontSize:26, fontWeight:400, lineHeight:1.4, marginBottom:8 }}>
          이런 날 있지 않으세요?
        </div>
        <div className="up" style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:36 }}>
          혼자 사는 여자라면 한 번쯤 느껴봤을 것들이에요
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {points.map((p, i) => (
            <div key={i} className="up" style={{ background:C.surface, borderRadius:16, padding:"20px", border:`1px solid ${C.border}`, animationDelay:`${i*.1}s` }}>
              <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                  {p.emoji}
                </div>
                <div>
                  <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:15, marginBottom:5 }}>{p.title}</div>
                  <div style={{ fontSize:13, color:C.sub, fontWeight:300, lineHeight:1.6 }}>{p.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"32px 28px 52px" }}>
        <button onClick={next} style={{ width:"100%", background:C.dark, color:"#fff", padding:"17px", borderRadius:8, fontSize:15, letterSpacing:.3 }}>
          맞아요, 그런 날 있어요 →
        </button>
      </div>
    </div>
  );
}

// ── 3. 고지 + 동의 ───────────────────────────────────────
function 고지동의({ agreed, setAgreed, allAgreed, next }) {
  const toggle = key => setAgreed(a => ({...a, [key]:!a[key]}));
  const toggleAll = () => {
    const all = !allAgreed;
    setAgreed({ ai:all, privacy:all, terms:all });
  };

  const items = [
    { key:"ai",      label:"AI 상담 서비스 고지 (필수)",      desc:"오롯은 AI가 먼저 응답하고, 임상심리사가 확인하는 서비스예요. AI의 답변은 의학적 진단이나 처방이 아니에요." },
    { key:"privacy", label:"개인정보 수집 및 이용 동의 (필수)", desc:"서비스 제공을 위해 닉네임, 기분 기록, 상담 내용을 수집해요. 외부에 공유되지 않아요." },
    { key:"terms",   label:"이용약관 동의 (필수)",              desc:"오롯 서비스 이용약관에 동의해요." },
  ];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      <ProgressBar step={2} total={4} />

      <div style={{ flex:1, padding:"40px 28px 0" }}>
        <div className="up" style={{ fontFamily:"'Noto Serif KR',serif", fontSize:26, fontWeight:400, lineHeight:1.4, marginBottom:8 }}>
          시작 전에<br />잠깐만
        </div>
        <div className="up" style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:32 }}>
          아래 내용 확인하고 동의해줘
        </div>

        {/* 전체 동의 */}
        <div className="up" onClick={toggleAll} style={{ background:allAgreed?C.dark:C.surface, borderRadius:14, padding:"18px 20px", border:`1.5px solid ${allAgreed?C.dark:C.border}`, marginBottom:16, cursor:"pointer", transition:"all .2s", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:22, height:22, borderRadius:"50%", border:`2px solid ${allAgreed?"#fff":C.muted}`, background:allAgreed?"#fff":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .2s" }}>
            {allAgreed && <div style={{ width:10, height:10, borderRadius:"50%", background:C.dark }}/>}
          </div>
          <div style={{ fontSize:14, fontWeight:500, color:allAgreed?"#fff":C.text }}>전체 동의하기</div>
        </div>

        {/* 개별 동의 */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {items.map(item => (
            <div key={item.key} onClick={() => toggle(item.key)} style={{ background:C.surface, borderRadius:14, padding:"16px 18px", border:`1px solid ${agreed[item.key]?C.warm:C.border}`, cursor:"pointer", transition:"all .2s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${agreed[item.key]?C.warm:C.muted}`, background:agreed[item.key]?C.warm:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .2s" }}>
                  {agreed[item.key] && <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }}/>}
                </div>
                <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{item.label}</div>
              </div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.7, fontWeight:300, paddingLeft:32 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"24px 28px 52px" }}>
        <button onClick={next} disabled={!allAgreed} style={{ width:"100%", background:allAgreed?C.dark:C.border, color:"#fff", padding:"17px", borderRadius:8, fontSize:15, letterSpacing:.3, transition:"background .2s", cursor:allAgreed?"pointer":"default" }}>
          동의하고 시작하기 →
        </button>
      </div>
    </div>
  );
}

// ── 4. 로그인 ────────────────────────────────────────────
function 로그인({ next }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해줘");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fn = mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
      const { error: err } = await fn;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      next();
    } catch (e) {
      setError(e.message || "다시 시도해줘");
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
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
      // 성공 시 자동 redirect → 돌아올 때 onAuthStateChange로 next() 호출됨
    } catch (e) {
      setError(e.message || "다시 시도해줘");
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
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
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      <ProgressBar step={3} total={4} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 28px" }}>
        <div className="up" style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:C.warmLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 20px" }}>
            🌿
          </div>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:24, fontWeight:400, marginBottom:8 }}>
            오롯에 들어가기
          </div>
          <div style={{ fontSize:13, color:C.muted, fontWeight:300, lineHeight:1.7 }}>
            기분 기록과 대화를<br />안전하게 보관하기 위해 필요해요
          </div>
        </div>

        {/* 이메일 입력 */}
        <div className="up" style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="email"
            style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", fontSize:14, color:C.text }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "비밀번호 (6자 이상)" : "비밀번호"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", fontSize:14, color:C.text }}
          />
        </div>

        {error && (
          <div style={{ fontSize:12, color:"#C44545", marginBottom:12, textAlign:"center", fontWeight:300 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleEmailAuth}
          disabled={loading}
          style={{ width:"100%", background:loading?C.muted:C.dark, color:"#fff", padding:"15px", borderRadius:8, fontSize:14, fontWeight:500, marginBottom:10, cursor:loading?"default":"pointer" }}
        >
          {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
        </button>

        <div style={{ textAlign:"center", marginBottom:24 }}>
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ fontSize:12, color:C.sub, fontWeight:300, textDecoration:"underline" }}
          >
            {mode === "login" ? "처음이세요? 가입하기" : "이미 계정 있으세요? 로그인"}
          </button>
        </div>

        {/* 구분선 */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ flex:1, height:1, background:C.border }} />
          <span style={{ fontSize:11, color:C.muted, fontWeight:300 }}>또는</span>
          <div style={{ flex:1, height:1, background:C.border }} />
        </div>

        {/* 소셜 로그인 */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {/* Google */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{ width:"100%", background:C.surface, color:C.text, border:`1px solid ${C.border}`, padding:"14px", borderRadius:8, fontSize:13, fontWeight:400, display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:loading?"default":"pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Google로 계속
          </button>

          {/* Apple */}
          <button
            onClick={handleAppleAuth}
            disabled={loading}
            style={{ width:"100%", background:"#000", color:"#fff", border:`1px solid #000`, padding:"14px", borderRadius:8, fontSize:13, fontWeight:400, display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:loading?"default":"pointer" }}
          >
            <span style={{ fontSize:16 }}></span>
            Apple로 계속
          </button>

          {/* Kakao - 비활성 */}
          <button
            disabled
            style={{ width:"100%", background:C.surface, color:C.muted, border:`1px solid ${C.border}`, padding:"14px", borderRadius:8, fontSize:13, fontWeight:400, display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:"not-allowed", opacity:0.6 }}
          >
            <span style={{ fontSize:16 }}>💬</span>
            카카오로 계속
            <span style={{ fontSize:10, marginLeft:4 }}>(준비 중)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 5. 닉네임 설정 ───────────────────────────────────────
function 닉네임설정({ nickname, setNickname, next }) {
  const examples = ["혼자살이중", "자취 3년차", "서울토박이", "새벽감성"];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      <ProgressBar step={4} total={5} />

      <div style={{ flex:1, padding:"40px 28px 0" }}>
        <div className="up" style={{ fontFamily:"'Noto Serif KR',serif", fontSize:26, fontWeight:400, lineHeight:1.4, marginBottom:8 }}>
          뭐라고 불러줄까?
        </div>
        <div className="up" style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:36 }}>
          피드에서 사용할 닉네임이에요. 언제든 바꿀 수 있어요.
        </div>

        <div className="up" style={{ background:C.surface, borderRadius:14, border:`1px solid ${nickname?C.warm:C.border}`, padding:"16px 20px", marginBottom:16, transition:"border .2s" }}>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value.slice(0,12))}
            placeholder="닉네임 입력 (최대 12자)"
            style={{ width:"100%", border:"none", background:"transparent", fontSize:16, color:C.text, fontWeight:300 }}
          />
        </div>

        <div style={{ fontSize:11, color:C.muted, marginBottom:24, fontWeight:300 }}>
          이런 닉네임은 어때?
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {examples.map(e => (
            <button key={e} onClick={() => setNickname(e)} style={{ padding:"8px 16px", borderRadius:40, fontSize:12, border:`1px solid ${C.border}`, color:C.sub, background:C.surface, fontWeight:300 }}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"32px 28px 52px" }}>
        <button onClick={next} disabled={!nickname.trim()} style={{ width:"100%", background:nickname.trim()?C.dark:C.border, color:"#fff", padding:"17px", borderRadius:8, fontSize:15, letterSpacing:.3, transition:"background .2s", cursor:nickname.trim()?"pointer":"default" }}>
          좋아, 이걸로 할게 →
        </button>
      </div>
    </div>
  );
}

// ── 6. 자치구 설정 ───────────────────────────────────────
function 자치구설정({ selectedGu, setSelectedGu, next }) {
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      <ProgressBar step={5} total={5} />

      <div style={{ flex:1, padding:"40px 28px 0", display:"flex", flexDirection:"column" }}>
        <div className="up" style={{ fontFamily:"'Noto Serif KR',serif", fontSize:26, fontWeight:400, lineHeight:1.4, marginBottom:8 }}>
          어느 동네에<br /><span style={{ color:C.warm }}>살고 계세요?</span>
        </div>
        <div className="up" style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:28, lineHeight:1.7 }}>
          우리 동네에 어떤 자원이 있는지 알려드릴게요.<br />언제든 바꿀 수 있어요.
        </div>

        <div className="up" style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {GU_LIST.map(gu => {
              const isSelected = selectedGu === gu;
              return (
                <button
                  key={gu}
                  onClick={() => setSelectedGu(gu)}
                  style={{
                    background: isSelected ? C.warm : C.surface,
                    color: isSelected ? "#fff" : C.text,
                    border: `1px solid ${isSelected ? C.warm : C.border}`,
                    borderRadius: 12,
                    padding: "14px 0",
                    fontSize: 14,
                    fontWeight: isSelected ? 500 : 400,
                    fontFamily: "'Noto Serif KR',serif",
                    letterSpacing: 0.3,
                    transition: "all 0.15s",
                  }}
                >
                  {gu}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding:"20px 28px 52px", background:C.bg, borderTop:`1px solid ${C.border}` }}>
        <button
          onClick={next}
          disabled={!selectedGu}
          style={{
            width:"100%",
            background: selectedGu ? C.dark : C.border,
            color:"#fff",
            padding:"17px",
            borderRadius:8,
            fontSize:15,
            letterSpacing:.3,
            transition:"background .2s",
            cursor: selectedGu ? "pointer" : "default"
          }}
        >
          {selectedGu ? `${selectedGu}로 시작하기 →` : "동네를 골라줘"}
        </button>
      </div>
    </div>
  );
}

// ── 7. 첫 기분 체크인 ────────────────────────────────────
function 첫기분체크({ selectedMood, setSelectedMood, setDone }) {
  const emotion = ONBOARDING_EMOTIONS.find(e => e.label === selectedMood);
  const [saving, setSaving] = useState(false);

  const startApp = async () => {
    if (saving) return;
    if (selectedMood) {
      setSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      <div style={{ flex:1, padding:"52px 28px 0" }}>
        <div className="up" style={{ fontFamily:"'Noto Serif KR',serif", fontSize:26, fontWeight:400, lineHeight:1.4, marginBottom:8 }}>
          마지막으로,<br />지금 기분은 어떠세요?
        </div>
        <div className="up" style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:36 }}>
          솔직하게 골라주세요. 여기선 다 괜찮아요.
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:12, justifyContent:"space-between" }}>
          {ONBOARDING_EMOTIONS.map(e => (
            <button key={e.label} className="emo" onClick={() => setSelectedMood(e.label)}
              style={{ width:"calc(25% - 9px)", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
              <div style={{ width:58, height:58, borderRadius:"50%", background:selectedMood===e.label?e.color+"88":C.surface, border:`2px solid ${selectedMood===e.label?e.color:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, boxShadow:selectedMood===e.label?`0 4px 16px ${e.color}66`:"0 2px 8px rgba(26,16,10,.05)", transition:"all .2s" }}>
                {e.emoji}
              </div>
              <span style={{ fontSize:10, color:selectedMood===e.label?C.warm:C.muted, fontWeight:selectedMood===e.label?500:300 }}>{e.label}</span>
            </button>
          ))}
        </div>

        {selectedMood && (
          <div className="up" style={{ marginTop:24, background:emotion?emotion.color+"33":C.card, borderRadius:14, padding:"16px 18px", border:`1px solid ${emotion?emotion.color+"66":C.border}` }}>
            <div style={{ fontSize:14, color:C.sub, lineHeight:1.75, fontWeight:300 }}>
              {selectedMood==="힘들어요" && "많이 힘드셨겠어요. 들려주세요 🤍"}
              {selectedMood==="외로워요" && "외로운 날이군요. 여기 있을게요."}
              {selectedMood==="불안해요" && "불안한 마음이시군요. 같이 이야기해봐요."}
              {selectedMood==="짜증나요" && "뭔가 쌓인 게 있으신가봐요. 다 말씀하셔도 돼요."}
              {selectedMood==="피곤해요" && "많이 지치셨군요. 오늘은 그냥 쉬셔도 괜찮아요."}
              {selectedMood==="괜찮아요" && "오늘 좋은 날이네요 😊 무슨 일 있으셨어요?"}
              {selectedMood==="평온해요" && "그 평온함 소중히 여기세요. 잘 하고 계세요."}
              {selectedMood==="설레요"   && "뭔가 좋은 일 있으셨군요! 들려주세요"}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:"28px 28px 52px" }}>
        <button
          onClick={startApp}
          disabled={!selectedMood || saving}
          style={{ width:"100%", background:selectedMood?C.warm:C.border, color:"#fff", padding:"17px", borderRadius:8, fontSize:15, letterSpacing:.3, transition:"background .2s", cursor:selectedMood?"pointer":"default" }}
        >
          {selectedMood ? "오롯 시작하기 →" : "기분을 골라주세요"}
        </button>
        <button onClick={() => setDone(true)} style={{ width:"100%", marginTop:12, padding:"12px", fontSize:13, color:C.muted, fontWeight:300 }}>
          나중에 할게요
        </button>
      </div>
    </div>
  );
}

// ── 완료 화면 ────────────────────────────────────────────
function 완료화면({ nickname, mood, gu, onStart }) {
  const emotion = ONBOARDING_EMOTIONS.find(e => e.label === mood);
  return (
    <div className="fade" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", textAlign:"center" }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:emotion?emotion.color+"66":C.warmLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, marginBottom:24, boxShadow:emotion?`0 8px 24px ${emotion.color}66`:"none" }}>
        🌿
      </div>
      <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:26, fontWeight:400, marginBottom:10, lineHeight:1.4 }}>
        반가워, {nickname || "친구"} 😊
      </div>
      {gu && (
        <div style={{ fontSize:12, color:C.warm, fontWeight:400, marginBottom:18, letterSpacing:0.5 }}>
          📍 {gu}
        </div>
      )}
      <div style={{ fontSize:14, color:C.sub, fontWeight:300, lineHeight:1.8, marginBottom:48 }}>
        오롯이 너의 자리.<br />힘들 때, 외로울 때, 그냥 말하고 싶을 때<br />언제든 와.
      </div>
      <button onClick={onStart} style={{ width:"100%", maxWidth:360, background:C.dark, color:"#fff", padding:"17px", borderRadius:8, fontSize:15, letterSpacing:.3 }}>
        시작하기 →
      </button>
    </div>
  );
}

function MainApp() {
  const [tab, setTab]             = useState("홈");
  const [moodLog, setMoodLog]     = useState({});
  const [todayMood, setTodayMood] = useState(null);
  const [diaryView, setDiaryView] = useState(false);
  const [userGu, setUserGu]       = useState(null);
  const [guModalOpen, setGuModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages]   = useState([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const [posts, setPosts]   = useState(FEED_POSTS);
  const [plan, setPlan]     = useState("sub");
  const bottomRef = useRef(null);

  useEffect(() => {
    // localStorage 캐시 먼저 (즉시 화면)
    try {
      const raw = localStorage.getItem("orot_mood_log");
      if (raw) {
        const log = JSON.parse(raw);
        setMoodLog(log);
        if (log[todayKey()]) setTodayMood(log[todayKey()]);
      }
    } catch(_){}
    try {
      const gu = localStorage.getItem("orot_user_gu");
      if (gu && GU_LIST.includes(gu)) setUserGu(gu);
    } catch(_){}

    // DB에서 진짜 데이터 불러와서 갈아끼움 (DB가 진실)
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // profiles에서 gu 불러오기
        const { data: profile } = await supabase
          .from("profiles")
          .select("gu")
          .eq("id", user.id)
          .single();
        if (profile?.gu && GU_LIST.includes(profile.gu)) {
          setUserGu(profile.gu);
          try { localStorage.setItem("orot_user_gu", profile.gu); } catch(_){}
        }

        // mood_logs에서 최근 60일치 불러오기 (홈탭 7일 + 일기 화면용)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const { data: moods } = await supabase
          .from("mood_logs")
          .select("date, mood_label, created_at")
          .gte("date", sixtyDaysAgo.toISOString().slice(0, 10))
          .order("created_at", { ascending: true });
        if (moods && moods.length > 0) {
          // 같은 날짜 중 가장 최근 것만 (β 결: 매번 새 row지만 표시는 마지막)
          const log = {};
          for (const m of moods) {
            log[m.date] = m.mood_label; // 시간순이라 마지막이 최신
          }
          setMoodLog(log);
          if (log[todayKey()]) setTodayMood(log[todayKey()]);
          try { localStorage.setItem("orot_mood_log", JSON.stringify(log)); } catch(_){}
        }
      } catch (e) {
        console.error("초기 데이터 불러오기 실패:", e);
      }
    })();
  }, []);

  // chat_messages에서 과거 메시지 불러오기
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("role, content, created_at")
          .order("created_at", { ascending: true });
        if (!mounted) return;
        if (error) {
          console.error("메시지 불러오기 실패:", error);
          setMessagesLoaded(true);
          return;
        }
        const formatted = (data || []).map(m => ({
          from: m.role === "ai" ? "ai" : "user",
          text: m.content,
          note: null,
        }));
        // 과거 메시지 없으면 첫 인사
        if (formatted.length === 0) {
          formatted.push({
            from: "ai",
            text: "오셨네요\n오늘은 어떤 하루였어요?",
            note: null,
          });
        }
        setMessages(formatted);
        setMessagesLoaded(true);
      } catch (e) {
        console.error("메시지 불러오기 예외:", e);
        if (mounted) setMessagesLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // 자치구 변경 시 localStorage에도 저장
  const changeGu = (gu) => {
    setUserGu(gu);
    try { localStorage.setItem("orot_user_gu", gu); } catch(_){}
    setGuModalOpen(false);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, typing]);

  const saveMood = async (label) => {
    setTodayMood(label);
    const newLog = { ...moodLog, [todayKey()]: label };
    setMoodLog(newLog);
    try { localStorage.setItem("orot_mood_log", JSON.stringify(newLog)); } catch(_){}
    // DB에 새 row insert (매번 새 row, 하루 안 변화 추적)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("mood_logs").insert({
          user_id: user.id,
          date: todayKey(),
          mood_label: label,
        });
      }
    } catch (e) {
      console.error("기분 저장 실패:", e);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || typing) return;
    const txt = input.trim();
    setInput("");
    setMessages(p => [...p, { from:"user", text:txt }]);
    setTyping(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: { message: txt },
      });
      if (error) throw error;
      const reply = data?.reply || "응답을 받지 못했어요. 다시 한 번 말씀해주실래요?";
      setMessages(p => [...p, { from:"ai", text:reply, note:null }]);
    } catch (e) {
      console.error("sendMessage 실패:", e);
      setMessages(p => [...p, {
        from:"ai",
        text:"잠깐 연결이 어려워요. 잠시 후 다시 시도해주세요.",
        note:null,
      }]);
    } finally {
      setTyping(false);
    }
  };

  const toggleLike = id => setPosts(p => p.map(x => x.id===id ? {...x, liked:!x.liked, likes:x.liked?x.likes-1:x.likes+1} : x));
  const toggleSave = id => setPosts(p => p.map(x => x.id===id ? {...x, savedByMe:!x.savedByMe, saved:x.savedByMe?x.saved-1:x.saved+1} : x));

  const streak = (() => {
    let n=0; const d=new Date();
    while(moodLog[dateKey(d)]){ n++; d.setDate(d.getDate()-1); }
    return n;
  })();

  const negDays = countConsecNegative(moodLog);
  const NAV = ["홈","털어놓기","피드","우리 동네"];
  const NAV_ICONS = ["◯","◎","⊟","◈"];

  return (
    <div style={{ fontFamily:"'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif", background:C.bg, minHeight:"100vh", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500&family=Noto+Sans+KR:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::placeholder { color:${C.muted}; }
        textarea:focus { outline:none; }
        textarea { resize:none; }
        ::-webkit-scrollbar { width:0; }
        button { cursor:pointer; border:none; background:none; }
        @keyframes up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot { 0%,80%,100%{opacity:.25;transform:scale(1)} 40%{opacity:1;transform:scale(1.4)} }
        .up { animation: up .3s ease forwards; }
        .emo { transition: transform .12s; }
        .emo:active { transform: scale(.9); }
      `}</style>

      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", display:"flex", flexDirection:"column", paddingBottom:76 }}>
        {tab==="홈"       && !diaryView && <홈탭 todayMood={todayMood} moodLog={moodLog} streak={streak} negDays={negDays} saveMood={saveMood} setTab={setTab} setDiaryView={setDiaryView} userGu={userGu} openGuModal={() => setGuModalOpen(true)} openSettings={() => setSettingsOpen(true)} />}
        {tab==="홈"       && diaryView  && <일기탭 moodLog={moodLog} setDiaryView={setDiaryView} />}
        {tab==="털어놓기" && <채팅탭 messages={messages} input={input} setInput={setInput} sendMessage={sendMessage} typing={typing} bottomRef={bottomRef} />}
        {tab==="피드"     && <피드탭 posts={posts} toggleLike={toggleLike} toggleSave={toggleSave} />}
        {tab==="우리 동네" && <우리동네탭 userGu={userGu} openGuModal={() => setGuModalOpen(true)} />}
      </div>

      {guModalOpen && <자치구변경모달 currentGu={userGu} onSelect={changeGu} onClose={() => setGuModalOpen(false)} />}
      {settingsOpen && <설정화면 onClose={() => setSettingsOpen(false)} userGu={userGu} />}

      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"rgba(248,244,239,.97)", backdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100 }}>
        {NAV.map((n,i) => (
          <button key={n} onClick={() => { setTab(n); setDiaryView(false); }} style={{ flex:1, padding:"13px 0 17px", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <span style={{ fontSize:15, color:tab===n?C.warm:C.muted, transition:"color .2s" }}>{NAV_ICONS[i]}</span>
            <span style={{ fontSize:10, letterSpacing:.5, color:tab===n?C.warm:C.muted, fontWeight:tab===n?500:400 }}>{n}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 홈 탭 ──────────────────────────────────────────────
function 홈탭({ todayMood, moodLog, streak, negDays, saveMood, setTab, setDiaryView, userGu, openGuModal, openSettings }) {
  const emotion = EMOTIONS.find(e => e.label === todayMood);
  const h = new Date().getHours();
  const greet = h<12 ? "좋은 아침이에요 ☀️" : h<18 ? "안녕하세요, 잘 지내고 계세요?" : "오늘 하루 수고하셨어요 🌙";
  const isPositive = todayMood && POSITIVE.includes(todayMood);
  const posPrompt = POSITIVE_PROMPTS[Math.floor(Math.random()*POSITIVE_PROMPTS.length)];

  return (
    <div className="up" style={{ flex:1, padding:"52px 24px 28px" }}>
      {/* 자치구 칩 (상단 좌측) + 톱니바퀴 (상단 우측) */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        {userGu ? (
          <button
            onClick={openGuModal}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              padding: "6px 12px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: C.sub,
              fontWeight: 400,
              letterSpacing: 0.3,
            }}
          >
            <span style={{ fontSize: 11, marginRight: 2 }}>📍</span>
            <span>{userGu}</span>
            <span style={{ fontSize: 9, color: C.muted, marginLeft: 2 }}>▾</span>
          </button>
        ) : <div />}
        <button
          onClick={openSettings}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "transparent",
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            color: C.sub,
          }}
          aria-label="설정"
        >
          ⚙
        </button>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:36 }}>
        <div>
          <div style={{ fontSize:11, letterSpacing:1.5, color:C.muted, marginBottom:10, fontWeight:300 }}>오로시</div>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:28, fontWeight:400, lineHeight:1.35 }}>
            {greet}<br />
            <span style={{ color:C.warm }}>오늘 기분은 어떠세요?</span>
          </div>
        </div>
        {streak > 0 && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"10px 14px", textAlign:"center", flexShrink:0 }}>
            <div style={{ fontSize:18 }}>🔥</div>
            <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:20, color:C.warm, lineHeight:1 }}>{streak}</div>
            <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>연속</div>
          </div>
        )}
      </div>

      {/* 부정 3일 이상 유도 배너 */}
      {negDays >= 3 && (
        <div className="up" style={{ background:"#FDF0EA", border:`1px solid ${C.warmLight}`, borderRadius:16, padding:"18px 20px", marginBottom:20 }}>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:15, color:C.warm, marginBottom:6 }}>
            요즘 많이 힘드시죠 😔
          </div>
          <div style={{ fontSize:13, color:C.sub, lineHeight:1.75, marginBottom:14, fontWeight:300 }}>
            {negDays}일째 힘드신 것 같아 마음에 걸려요.<br />혼자 담아두지 말고 들려주세요.
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setTab("털어놓기")} style={{ flex:1, background:C.warm, color:"#fff", padding:"11px", borderRadius:8, fontSize:13 }}>
              오로시에게 들려주기
            </button>
          </div>
        </div>
      )}

      {/* 감정 선택 */}
      {!todayMood ? (
        <div style={{ marginBottom:32 }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"space-between" }}>
            {EMOTIONS.map(e => (
              <button key={e.label} className="emo" onClick={() => saveMood(e.label)}
                style={{ width:"calc(25% - 8px)", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:C.surface, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:"0 2px 8px rgba(26,16,10,.05)" }}>
                  {e.emoji}
                </div>
                <span style={{ fontSize:10, color:C.muted, fontWeight:300 }}>{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="up" style={{ marginBottom:28 }}>
          <div style={{ background:emotion ? emotion.color+"44" : C.card, borderRadius:20, padding:"22px", border:`1px solid ${emotion ? emotion.color+"88" : C.border}`, marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
              <span style={{ fontSize:36 }}>{emotion?.emoji}</span>
              <div>
                <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:16, color:C.text, marginBottom:3 }}>오늘은 {todayMood}</div>
                <div style={{ fontSize:11, color:C.sub, fontWeight:300 }}>오늘 기분 기록됐어요 ✓</div>
              </div>
            </div>
            <div style={{ fontSize:14, color:C.sub, lineHeight:1.8, fontWeight:300, background:"rgba(255,255,255,.55)", borderRadius:12, padding:"12px 14px" }}>
              {isPositive ? posPrompt : (MOOD_MSGS[todayMood] || "들려주세요.")}
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setTab("털어놓기")} style={{ flex:1, background:C.dark, color:"#fff", padding:"14px", borderRadius:8, fontSize:13, letterSpacing:.3 }}>
              {isPositive ? "오로시에게 들려주기" : "혼잣말하기"}
            </button>
            <button onClick={() => setDiaryView(true)} style={{ flex:1, background:C.surface, color:C.sub, padding:"14px", borderRadius:8, fontSize:13, border:`1px solid ${C.border}` }}>
              기분 기록
            </button>
          </div>
        </div>
      )}

      {/* 최근 7일 */}
      <div style={{ background:C.surface, borderRadius:16, padding:"18px 20px", border:`1px solid ${C.border}`, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:14 }}>최근 7일</div>
          <button onClick={() => setDiaryView(true)} style={{ fontSize:11, color:C.warm }}>전체 보기 →</button>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {Array.from({length:7}, (_,i) => {
            const d = new Date(); d.setDate(d.getDate()-(6-i));
            const k = dateKey(d);
            const emo = EMOTIONS.find(e => e.label===moodLog[k]);
            const isToday = i===6;
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                <div style={{ fontSize:9, color:isToday?C.warm:C.muted, fontWeight:isToday?500:400 }}>{DAY_KR[d.getDay()]}</div>
                <div style={{ width:36, height:36, borderRadius:"50%", background:emo?emo.color+"55":C.card, border:`1px solid ${emo?emo.color:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>
                  {emo?.emoji||""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 바로가기 */}
      <div style={{ display:"flex", gap:12 }}>
        <button onClick={() => setTab("피드")} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 16px", textAlign:"left" }}>
          {/* 노트 그림 - 세이지 워시 */}
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ marginBottom:8 }}>
            <path d="M 8 8 L 36 6 L 38 36 L 10 38 Z" fill="#B8D4BE" opacity="0.5"/>
            <path d="M 9 9 Q 9 9 36 7 L 37 36 Q 37 36 10 37 Z" stroke={C.warm} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M 15 17 Q 24 16 32 16" stroke={C.warm} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            <path d="M 15 23 Q 24 22 32 22" stroke={C.warm} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            <path d="M 15 29 Q 21 28 27 28" stroke={C.warm} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:14, marginBottom:3 }}>1인가구 피드</div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:300 }}>혼자 사는 사람들 일상</div>
        </button>

        <button onClick={() => setTab("우리 동네")} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"18px 16px", textAlign:"left" }}>
          {/* 핀 + 잎 그림 - 하늘색 워시, 둘레 점선 (강강수월래) */}
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ marginBottom:8 }}>
            {/* 동네 영역 - 핀 발밑에 가로로 누운 타원 */}
            <ellipse cx="22" cy="38" rx="14" ry="3" stroke={C.warm} strokeWidth="1" fill="none" opacity="0.7"/>
            {/* 핀 워시 */}
            <path d="M 22 8 Q 33 8 33 19 Q 33 27 22 38 Q 11 27 11 19 Q 11 8 22 8 Z" fill="#C4D0E8" opacity="0.5"/>
            {/* 핀 외곽선 */}
            <path d="M 22 9 Q 32 9.5 32 19 Q 32 26.5 22 37 Q 12 26.5 12 19 Q 12 9 22 9 Z" stroke={C.warm} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            {/* 안쪽 잎 (오로시 🌿 결) */}
            <path d="M 18 21 Q 22 16 26 19 Q 24 23 18 21 Z" fill="#FFFFFF"/>
            <path d="M 18 21 Q 22 16 26 19 Q 24 23 18 21 Z" stroke={C.warm} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M 19 20 Q 22 18 25 19" stroke={C.warm} strokeWidth="0.7" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:14, marginBottom:3 }}>우리 동네</div>
          <div style={{ fontSize:10, color:C.muted, fontWeight:300 }}>동네 마음챙김 프로그램</div>
        </button>
      </div>
    </div>
  );
}

// ── 일기 탭 ──────────────────────────────────────────────
function 일기탭({ moodLog, setDiaryView }) {
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const days  = getCalendarDays(y, m);
  const tk    = todayKey();
  const total = Object.keys(moodLog).length;
  const top   = EMOTIONS.map(e => ({...e, count:Object.values(moodLog).filter(v=>v===e.label).length})).filter(e=>e.count>0).sort((a,b)=>b.count-a.count);

  const prevM = () => { if(m===0){setY(y-1);setM(11);}else setM(m-1); };
  const nextM = () => {
    const n=new Date();
    if(y>n.getFullYear()||(y===n.getFullYear()&&m>=n.getMonth())) return;
    if(m===11){setY(y+1);setM(0);}else setM(m+1);
  };

  const streak = (() => { let n=0; const d=new Date(); while(moodLog[dateKey(d)]){n++;d.setDate(d.getDate()-1);} return n; })();

  return (
    <div className="up" style={{ flex:1, padding:"48px 24px 24px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:28 }}>
        <button onClick={()=>setDiaryView(false)} style={{ fontSize:20, color:C.muted }}>←</button>
        <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:24 }}>기분 기록</div>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        {[
          { label:"총 기록", value:total, unit:"일" },
          { label:"가장 많이", value:top[0]?.emoji||"—", unit:"", big:true },
          { label:"연속 기록", value:streak, unit:"일" },
        ].map((s,i) => (
          <div key={i} style={{ flex:1, background:C.surface, borderRadius:14, padding:"16px 12px", border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:s.big?26:24, color:C.warm, lineHeight:1.1 }}>
              {s.value}<span style={{ fontSize:12 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize:10, color:C.muted, marginTop:4, fontWeight:300 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.surface, borderRadius:16, padding:"20px", border:`1px solid ${C.border}`, marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <button onClick={prevM} style={{ fontSize:20, color:C.muted, padding:"4px 10px" }}>‹</button>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:15 }}>{y}년 {MONTH_KR[m]}</div>
          <button onClick={nextM} style={{ fontSize:20, color:C.muted, padding:"4px 10px" }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:8 }}>
          {DAY_KR.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, color:C.muted, fontWeight:300 }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px 2px" }}>
          {days.map((day,i) => {
            if (!day) return <div key={i}/>;
            const k = `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const emo = EMOTIONS.find(e => e.label===moodLog[k]);
            const isToday = k===tk;
            return (
              <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"3px 1px" }}>
                <div style={{ fontSize:17 }}>{emo?.emoji||""}</div>
                <div style={{ fontSize:10, color:isToday?C.warm:C.sub, fontWeight:isToday?500:300 }}>{day}</div>
                {isToday && <div style={{ width:3, height:3, borderRadius:"50%", background:C.warm }}/>}
              </div>
            );
          })}
        </div>
      </div>

      {top.length > 0 && (
        <div style={{ background:C.surface, borderRadius:16, padding:"18px 20px", border:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:15, marginBottom:14 }}>감정 분포</div>
          {top.slice(0,6).map(e => (
            <div key={e.label} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ fontSize:16, width:22 }}>{e.emoji}</span>
              <span style={{ fontSize:12, color:C.sub, width:54, fontWeight:300 }}>{e.label}</span>
              <div style={{ flex:1, height:6, background:C.card, borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", background:e.color, width:`${(e.count/total)*100}%`, borderRadius:3, transition:"width .5s" }}/>
              </div>
              <span style={{ fontSize:11, color:C.muted, width:16, textAlign:"right" }}>{e.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 채팅 탭 ──────────────────────────────────────────────
function 채팅탭({ messages, input, setInput, sendMessage, typing, bottomRef }) {
  const hk = e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} };
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", height:"calc(100vh - 76px)" }}>
      <div style={{ padding:"32px 24px 18px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:24, marginBottom:5 }}>털어놓기</div>
        <div style={{ fontSize:12, color:C.warm, fontWeight:300 }}>익명 · 너 얘기 잘 들을게</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"24px 20px 0" }}>
        {messages.map((msg,i) => (
          <div key={i} className="up" style={{ marginBottom:20, display:"flex", flexDirection:"column", alignItems:msg.from==="user"?"flex-end":"flex-start" }}>
            {msg.from==="ai" && <div style={{ fontSize:10, color:C.muted, marginBottom:6 }}>오로시</div>}
            <div style={{ maxWidth:"76%", padding:"13px 17px", borderRadius:msg.from==="user"?"20px 20px 4px 20px":"4px 20px 20px 20px", background:msg.from==="user"?C.dark:C.surface, color:msg.from==="user"?"#fff":C.text, fontSize:14, lineHeight:1.8, fontWeight:300, whiteSpace:"pre-line", boxShadow:msg.from==="ai"?"0 2px 12px rgba(26,16,10,.06)":"none" }}>
              {msg.text}
            </div>
            {msg.note && (
              <div style={{ maxWidth:"76%", marginTop:8, padding:"11px 15px", borderRadius:"4px 16px 16px 16px", background:"#FBF5F0", border:`1px solid ${C.warmLight}` }}>
                <div style={{ fontSize:10, color:C.warm, marginBottom:4 }}>🌿 한마디</div>
                <div style={{ fontSize:12, color:C.sub, lineHeight:1.7, fontWeight:300 }}>{msg.note}</div>
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:6 }}>오로시</div>
            <div style={{ display:"inline-flex", gap:5, padding:"13px 18px", background:C.surface, borderRadius:"4px 20px 20px 20px", boxShadow:"0 2px 12px rgba(26,16,10,.06)" }}>
              {[0,1,2].map(i=><span key={i} style={{ width:5, height:5, borderRadius:"50%", background:C.muted, display:"block", animation:`dot 1.2s ${i*.2}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:"14px 20px 22px", borderTop:`1px solid ${C.border}`, background:C.bg }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-end" }}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={hk}
            placeholder="어떤 말이든 들려주세요..."
            rows={2} style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"13px 16px", fontSize:14, color:C.text, fontWeight:300, lineHeight:1.6 }}/>
          <button onClick={sendMessage} style={{ width:46, height:46, borderRadius:"50%", background:input.trim()?C.dark:C.border, color:"#fff", fontSize:17, flexShrink:0, transition:"background .2s" }}>↑</button>
        </div>
      </div>
    </div>
  );
}

// ── 피드 탭 ──────────────────────────────────────────────
function 피드탭({ posts, toggleLike, toggleSave }) {
  const [filter, setFilter] = useState("전체");
  const tags = ["전체","꿀팁","감성","일상"];
  const list = filter==="전체" ? posts : posts.filter(p=>p.tag===filter);
  return (
    <div style={{ flex:1 }}>
      <div style={{ padding:"32px 24px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:24, marginBottom:4 }}>피드</div>
        <div style={{ fontSize:12, color:C.sub, fontWeight:300, marginBottom:18 }}>1인가구들의 이야기</div>
        <div style={{ display:"flex", gap:8 }}>
          {tags.map(t => (
            <button key={t} onClick={()=>setFilter(t)} style={{ padding:"7px 16px", borderRadius:40, fontSize:12, border:`1px solid ${filter===t?C.dark:C.border}`, background:filter===t?C.dark:"transparent", color:filter===t?"#fff":C.muted, transition:"all .2s" }}>{t}</button>
          ))}
          <button style={{ marginLeft:"auto", padding:"7px 14px", borderRadius:40, fontSize:12, border:`1px solid ${C.warm}`, color:C.warm }}>+ 올리기</button>
        </div>
      </div>
      <div style={{ padding:"16px 20px" }}>
        {list.map((post,i) => (
          <div key={post.id} className="up" style={{ background:C.surface, borderRadius:16, padding:"22px", marginBottom:14, border:`1px solid ${C.border}`, animationDelay:`${i*.05}s` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{post.emoji}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{post.user}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{post.time}</div>
                </div>
              </div>
              <span style={{ fontSize:10, padding:"4px 12px", borderRadius:20, background:C.card, color:C.sub }}>{post.tag}</span>
            </div>
            <div style={{ fontSize:14, color:C.text, lineHeight:1.8, fontWeight:300, marginBottom:18 }}>{post.content}</div>
            <div style={{ display:"flex", alignItems:"center", gap:20, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
              <button onClick={()=>toggleLike(post.id)} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:16, color:post.liked?"#D4695A":C.muted, transition:"color .2s" }}>♥</span>
                <span style={{ fontSize:13, color:post.liked?C.warm:C.muted, fontWeight:post.liked?500:400 }}>{post.likes}</span>
              </button>
              <button onClick={()=>toggleSave(post.id)} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:15, color:post.savedByMe?C.warm:C.muted, transition:"color .2s" }}>{post.savedByMe?"★":"☆"}</span>
                <span style={{ fontSize:13, color:post.savedByMe?C.warm:C.muted, fontWeight:post.savedByMe?500:400 }}>{post.saved}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 상담 탭 (다음 단계: 우리 동네 탭으로 교체 예정) ────────
function 우리동네탭({ userGu, openGuModal }) {
  const { programs, loading, error } = usePrograms();

  // 자치구 미설정 (안전망 - 온보딩에서 강제라 거의 발생 안 함)
  if (!userGu) {
    return (
      <div style={{ flex:1, padding:"32px 26px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:C.warmLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:20 }}>📍</div>
        <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:18, marginBottom:10, textAlign:"center" }}>
          자치구를 먼저 설정해주세요
        </div>
        <div style={{ fontSize:13, color:C.sub, fontWeight:300, lineHeight:1.7, textAlign:"center", marginBottom:24 }}>
          우리 동네 마음챙김 프로그램을<br />보여드릴게요.
        </div>
        <button onClick={openGuModal} style={{ background:C.warm, color:"#fff", padding:"12px 24px", borderRadius:8, fontSize:14 }}>
          자치구 설정하기
        </button>
      </div>
    );
  }

  // 로딩 중
  if (loading) {
    return (
      <div style={{ flex:1, padding:"32px 26px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
        <div style={{ width:48, height:48, border:`3px solid ${C.border}`, borderTopColor:C.warm, borderRadius:"50%", animation:"spin 1s linear infinite", marginBottom:20 }} />
        <div style={{ fontSize:13, color:C.sub, fontWeight:300 }}>프로그램을 불러오고 있어요...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // 에러 - fallback 없이 깔끔하게 안내
  if (error) {
    return (
      <div style={{ flex:1, padding:"32px 26px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:C.card, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, marginBottom:18 }}>📡</div>
        <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:17, marginBottom:8, textAlign:"center" }}>
          지금 정보를 불러올 수 없어요
        </div>
        <div style={{ fontSize:12, color:C.sub, fontWeight:300, lineHeight:1.7, textAlign:"center", marginBottom:20 }}>
          잠시 후 다시 시도해주세요.
        </div>
        <button onClick={() => window.location.reload()} style={{ background:C.warm, color:"#fff", padding:"10px 22px", borderRadius:8, fontSize:13 }}>
          다시 시도
        </button>
      </div>
    );
  }

  // 성공 - 데이터 분리
  const { ours, city } = splitProgramsByGu(programs, userGu);
  const hasOurs = ours.length > 0;
  const hasCity = city.length > 0;

  return (
    <div style={{ flex:1, padding:"24px 22px 32px" }}>
      {/* 헤더 */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:24, fontWeight:400, marginBottom:6 }}>
          우리 동네
        </div>
        <div style={{ fontSize:13, color:C.sub, fontWeight:300 }}>
          {userGu}의 마음챙김 프로그램
        </div>
      </div>

      {/* 시 단위 섹션 (있을 때만) */}
      {hasCity && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <span style={{ fontSize:14 }}>🏙️</span>
            <div style={{ fontSize:13, fontWeight:500, color:C.text, letterSpacing:.3 }}>서울시 전체</div>
          </div>
          <div style={{ fontSize:11, color:C.muted, fontWeight:300, marginBottom:12 }}>
            어느 동네에 살든 신청할 수 있어요
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {city.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
        </div>
      )}

      {/* 우리 자치구 섹션 */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
          <span style={{ fontSize:14 }}>📍</span>
          <div style={{ fontSize:13, fontWeight:500, color:C.text, letterSpacing:.3 }}>{userGu}</div>
        </div>

        {hasOurs ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {ours.map((p) => <ProgramCard key={p.id} program={p} />)}
          </div>
        ) : (
          // 빈 상태
          <div style={{ background:C.surface, borderRadius:16, padding:"28px 22px", border:`1px solid ${C.border}`, textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:10 }}>🌱</div>
            <div style={{ fontSize:14, color:C.text, fontWeight:400, lineHeight:1.7, marginBottom:6 }}>
              {hasCity
                ? `${userGu}에 등록된 프로그램은 아직 없어요.`
                : "이 동네에는 아직 등록된 프로그램이 없어요."}
            </div>
            <div style={{ fontSize:12, color:C.sub, fontWeight:300, lineHeight:1.7, marginBottom:hasCity?0:16 }}>
              {hasCity
                ? "위의 서울시 전체 프로그램은 누구나 신청할 수 있어요."
                : "다른 동네도 둘러보시겠어요?"}
            </div>
            {!hasCity && (
              <button onClick={openGuModal} style={{ background:C.warm, color:"#fff", padding:"10px 22px", borderRadius:8, fontSize:13 }}>
                다른 동네 보기 →
              </button>
            )}
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div style={{ fontSize:10, color:C.muted, fontWeight:300, textAlign:"center", paddingTop:8, borderTop:`1px solid ${C.border}` }}>
        출처: 서울시 1인가구 참여프로그램
      </div>
    </div>
  );
}

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
      onMouseEnter={hasLink ? (e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(26,16,10,.06)"; } : undefined}
      onMouseLeave={hasLink ? (e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; } : undefined}
    >
      <div style={{ fontSize:14, fontWeight:400, color:C.text, lineHeight:1.5, marginBottom:8 }}>
        {title}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:C.sub, fontWeight:300 }}>
        <span>📅 {dateLabel}</span>
        {!hasLink && (
          <span style={{ color:C.muted, fontSize:10 }}>· 신청 정보가 없어요</span>
        )}
        {hasLink && (
          <span style={{ marginLeft:"auto", color:C.warm, fontSize:11 }}>신청하기 →</span>
        )}
      </div>
    </div>
  );
}

// ── 설정 화면 ─────────────────────────────────────
function 설정화면({ onClose, userGu }) {
  const [view, setView] = useState("main"); // main / nickname / gov_id / emergency / emergency_add
  const [nickname, setNickname] = useState("");
  const [govId, setGovId] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [verifiedAt, setVerifiedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", relationship: "가족", phone: "" });
  const center = userGu ? GU_CENTERS[userGu] : null;
  const adminConnected = center?.admin_connected || false;

  // profile 데이터 불러오기
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("nickname, gov_assigned_id, verified_at")
          .eq("id", user.id)
          .single();
        if (data) {
          setNickname(data.nickname || "");
          setGovId(data.gov_assigned_id || "");
          setSavedAt(data.gov_assigned_id ? "saved" : null);
          setVerifiedAt(data.verified_at);
        }
        // emergency_contacts도 같이 불러옴
        const { data: ec } = await supabase
          .from("emergency_contacts")
          .select("id, name, phone, relationship, created_at")
          .order("created_at", { ascending: true });
        setContacts(ec || []);
      } catch (e) {
        console.error("프로필 불러오기 실패:", e);
      }
    })();
  }, []);

  const addContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.trim() || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("emergency_contacts")
          .insert({
            user_id: user.id,
            name: newContact.name.trim(),
            phone: newContact.phone.trim(),
            relationship: newContact.relationship,
          })
          .select()
          .single();
        if (error) throw error;
        setContacts(p => [...p, data]);
        setNewContact({ name: "", relationship: "가족", phone: "" });
        setView("emergency");
      }
    } catch (e) {
      console.error("연락처 추가 실패:", e);
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (id) => {
    if (!confirm("이 연락처를 삭제하시겠어요?")) return;
    try {
      await supabase.from("emergency_contacts").delete().eq("id", id);
      setContacts(p => p.filter(c => c.id !== id));
    } catch (e) {
      console.error("연락처 삭제 실패:", e);
    }
  };

  const handleLogout = async () => {
    if (!confirm("정말 로그아웃 하시겠어요?")) return;
    try {
      localStorage.removeItem("orot_onboarded");
      localStorage.removeItem("orot_user_gu");
      localStorage.removeItem("orot_mood_log");
      await supabase.auth.signOut();
      location.reload();
    } catch (e) {
      console.error("로그아웃 실패:", e);
    }
  };

  const saveNickname = async () => {
    if (!nickname.trim() || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles")
          .update({ nickname: nickname.trim() })
          .eq("id", user.id);
        setView("main");
      }
    } catch (e) {
      console.error("닉네임 저장 실패:", e);
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const saveGovId = async () => {
    if (!govId.trim() || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles")
          .update({ gov_assigned_id: govId.trim() })
          .eq("id", user.id);
        setSavedAt("saved");
        setView("main");
      }
    } catch (e) {
      console.error("부여번호 저장 실패:", e);
      alert("저장 실패. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: C.bg,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* 헤더 */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => {
            if (view === "main") onClose();
            else if (view === "emergency_add") setView("emergency");
            else setView("main");
          }}
          style={{ fontSize: 22, color: C.sub, background: "transparent", padding: 4 }}
          aria-label="닫기"
        >
          ←
        </button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17, fontWeight: 400 }}>
          {view === "main" && "설정"}
          {view === "nickname" && "닉네임 변경"}
          {view === "gov_id" && "자치구 부여번호"}
          {view === "emergency" && "긴급 연락처"}
          {view === "emergency_add" && "연락처 추가"}
        </div>
        <div style={{ width: 30 }} />
      </div>

      {/* 메인 화면 */}
      {view === "main" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* 자치구 1인가구 지원센터 카드 */}
          {center?.name && (
            <div style={{ padding: "16px 24px" }}>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, letterSpacing: 0.5, marginBottom: 6 }}>
                  📍 {userGu} 1인가구 지원
                </div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 4 }}>
                  {center.name}
                </div>
                <a
                  href={`tel:${center.phone}`}
                  style={{ fontSize: 15, color: C.warm, fontWeight: 500, textDecoration: "none" }}
                >
                  {center.phone}
                </a>
              </div>
            </div>
          )}

          {/* 메뉴 */}
          <div style={{ padding: "8px 0" }}>
            <SettingsItem
              label="프로필"
              sub={nickname || "닉네임 미설정"}
              onClick={() => setView("nickname")}
            />
            <SettingsItem
              label="자치구"
              sub={userGu || "선택 안 됨"}
              onClick={() => alert("자치구 변경 — 홈 화면 좌측 상단의 자치구 칩으로 변경하실 수 있어요")}
            />
            <SettingsItem
              label="자치구 부여번호"
              sub={
                !adminConnected
                  ? "연결 준비 중"
                  : verifiedAt
                    ? `활성화됨 ✓`
                    : govId
                      ? `${govId} (확인 대기 중)`
                      : "등록 안 됨"
              }
              onClick={() => setView("gov_id")}
            />
            <SettingsItem
              label="긴급 연락처"
              sub={contacts.length > 0 ? `${contacts.length}명 등록됨` : "등록된 연락처 없음"}
              onClick={() => setView("emergency")}
            />

            <div style={{ height: 1, background: C.border, margin: "16px 24px" }} />

            <SettingsItem
              label="로그아웃"
              sub=""
              onClick={handleLogout}
              danger
            />
          </div>
        </div>
      )}

      {/* 닉네임 변경 화면 */}
      {view === "nickname" && (
        <div style={{ flex: 1, padding: "32px 24px" }}>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 8, fontWeight: 300 }}>
            앱에서 사용할 닉네임이에요
          </div>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="닉네임"
            maxLength={20}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 15,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              background: C.surface,
              marginBottom: 16,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={saveNickname}
            disabled={!nickname.trim() || saving}
            style={{
              width: "100%",
              background: nickname.trim() ? C.dark : C.border,
              color: "#fff",
              padding: "15px",
              borderRadius: 8,
              fontSize: 14,
              cursor: nickname.trim() ? "pointer" : "default",
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      )}

      {/* 부여번호 화면 */}
      {view === "gov_id" && (
        <div style={{ flex: 1, padding: "32px 24px" }}>
          {!adminConnected ? (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 8, lineHeight: 1.6 }}>
                {userGu}는 부여번호 시스템<br />연결 준비 중이에요
              </div>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
                자치구청과 연결되면 부여번호 등록을 통해<br />
                1인가구 지원 자원이 활성화돼요.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 8, fontWeight: 300, lineHeight: 1.7 }}>
                {userGu}청에서 발급받은 번호를 입력해주세요.<br />
                확인 후 1인가구 자원 연결이 활성화돼요.
              </div>
              <input
                type="text"
                value={govId}
                onChange={e => setGovId(e.target.value)}
                placeholder="부여번호"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 15,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.surface,
                  marginBottom: 12,
                  marginTop: 12,
                  fontFamily: "inherit",
                }}
              />
              {savedAt && !verifiedAt && (
                <div style={{ fontSize: 12, color: C.warm, fontWeight: 300, marginBottom: 16 }}>
                  ⏳ {userGu}청 확인 대기 중
                </div>
              )}
              {verifiedAt && (
                <div style={{ fontSize: 12, color: "#5C8A5C", fontWeight: 400, marginBottom: 16 }}>
                  ✓ 1인가구 자원 활성화됨
                </div>
              )}
              <button
                onClick={saveGovId}
                disabled={!govId.trim() || saving}
                style={{
                  width: "100%",
                  background: govId.trim() ? C.dark : C.border,
                  color: "#fff",
                  padding: "15px",
                  borderRadius: 8,
                  fontSize: 14,
                  cursor: govId.trim() ? "pointer" : "default",
                }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </>
          )}
        </div>
      )}

      {/* 긴급 연락처 화면 */}
      {view === "emergency" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 12, fontWeight: 300, lineHeight: 1.7 }}>
            힘드실 때 연락할 수 있는 분을 등록해주세요.<br />
            최대 3명까지 등록 가능해요.
          </div>

          {/* 신뢰 안내 */}
          <div style={{ background: C.warmLight + "55", border: `1px solid ${C.warmLight}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
              등록한 연락처는 사용자만 볼 수 있어요.<br />
              위기 상황이 감지되면 동의하신 경우에 한해 안내가 갈 수 있어요.
            </div>
          </div>

          {/* 등록한 연락처 */}
          {contacts.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {contacts.map(c => (
                <div
                  key={c.id}
                  style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 400, marginBottom: 4 }}>
                      {c.name} <span style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginLeft: 6 }}>{c.relationship}</span>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      style={{ fontSize: 13, color: C.warm, textDecoration: "none" }}
                    >
                      {c.phone}
                    </a>
                  </div>
                  <button
                    onClick={() => removeContact(c.id)}
                    style={{ fontSize: 12, color: C.muted, background: "transparent", padding: "4px 8px" }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 추가 버튼 */}
          {contacts.length < 3 && (
            <button
              onClick={() => setView("emergency_add")}
              style={{
                width: "100%",
                padding: "14px",
                background: "transparent",
                border: `1px dashed ${C.border}`,
                borderRadius: 12,
                color: C.sub,
                fontSize: 13,
                marginBottom: 24,
              }}
            >
              + 연락처 추가하기
            </button>
          )}

          {/* 24시간 공공 자원 */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, letterSpacing: 0.5, marginBottom: 8 }}>
              24시간 공공 자원
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: 400, marginBottom: 4 }}>
                정신건강위기상담전화
              </div>
              <a
                href="tel:1577-0199"
                style={{ fontSize: 15, color: C.warm, fontWeight: 500, textDecoration: "none" }}
              >
                1577-0199
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 연락처 추가 화면 */}
      {view === "emergency_add" && (
        <div style={{ flex: 1, padding: "32px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 300 }}>이름</div>
            <input
              type="text"
              value={newContact.name}
              onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
              maxLength={20}
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 14,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                background: C.surface,
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 300 }}>관계</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["가족", "친구", "연인", "동료", "기타"].map(r => (
                <button
                  key={r}
                  onClick={() => setNewContact(p => ({ ...p, relationship: r }))}
                  style={{
                    padding: "8px 14px",
                    fontSize: 12,
                    border: `1px solid ${newContact.relationship === r ? C.warm : C.border}`,
                    borderRadius: 999,
                    background: newContact.relationship === r ? C.warm : "transparent",
                    color: newContact.relationship === r ? "#fff" : C.sub,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6, fontWeight: 300 }}>전화번호</div>
            <input
              type="tel"
              value={newContact.phone}
              onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
              placeholder="010-0000-0000"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 14,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                background: C.surface,
                fontFamily: "inherit",
              }}
            />
          </div>

          <button
            onClick={addContact}
            disabled={!newContact.name.trim() || !newContact.phone.trim() || saving}
            style={{
              width: "100%",
              background: (newContact.name.trim() && newContact.phone.trim()) ? C.dark : C.border,
              color: "#fff",
              padding: "15px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      )}

      {/* 푸터 */}
      {view === "main" && (
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted, textAlign: "center", fontWeight: 300 }}>
          오롯 v0.1
        </div>
      )}
    </div>
  );
}

function SettingsItem({ label, sub, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "16px 24px",
        background: "transparent",
        textAlign: "left",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 14, color: danger ? "#C73E3E" : C.text, fontWeight: 400 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginTop: 2 }}>{sub}</div>}
      </div>
      {!danger && <span style={{ fontSize: 14, color: C.muted }}>›</span>}
    </button>
  );
}

// ── 자치구 변경 모달 ─────────────────────────────────────
function 자치구변경모달({ currentGu, onSelect, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(26,16,10,0.4)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.bg,
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* 헤더 */}
        <div style={{ padding: "24px 24px 16px" }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              color: C.sub,
              padding: 0,
              marginBottom: 12,
              cursor: "pointer",
            }}
          >✕</button>
          <div style={{ fontFamily:"'Noto Serif KR',serif", fontSize:22, fontWeight:400, lineHeight:1.4, marginBottom:6 }}>
            어느 동네로 <span style={{ color:C.warm }}>바꿀까요?</span>
          </div>
          <div style={{ fontSize:12, color:C.sub, lineHeight:1.7, fontWeight:300 }}>
            이사하셨거나 다른 동네 정보가 궁금하시면 바꾸셔도 돼요.
          </div>
        </div>

        {/* 자치구 그리드 */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {GU_LIST.map(gu => {
              const isSelected = currentGu === gu;
              return (
                <button
                  key={gu}
                  onClick={() => onSelect(gu)}
                  style={{
                    background: isSelected ? C.warm : C.surface,
                    color: isSelected ? "#fff" : C.text,
                    border: `1px solid ${isSelected ? C.warm : C.border}`,
                    borderRadius: 12,
                    padding: "14px 0",
                    fontSize: 14,
                    fontWeight: isSelected ? 500 : 400,
                    fontFamily: "'Noto Serif KR',serif",
                    letterSpacing: 0.3,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {gu}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════
// 최상위 App - 온보딩 vs 메인앱 분기
// ════════════════════════════════════════════════════════════

export default function App() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(() => {
    try {
      return localStorage.getItem("orot_onboarded") === "1";
    } catch {
      return false;
    }
  });

  // 세션 감지
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
      // 로그아웃 시 온보딩 깃발도 리셋
      if (event === "SIGNED_OUT") {
        try { localStorage.removeItem("orot_onboarded"); } catch {}
        setOnboarded(false);
      }
    });
    return () => { mounted = false; subscription?.unsubscribe(); };
  }, []);

  const handleOnboardingComplete = () => {
    try { localStorage.setItem("orot_onboarded", "1"); } catch {}
    setOnboarded(true);
  };

  // 세션 로딩 중
  if (sessionLoading) {
    return (
      <div style={{ minHeight:"100vh", background:"#F8F4EF", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:48, height:48, border:"3px solid #E8DDD5", borderTopColor:"#9B5E45", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // 로그인 안 됐거나 온보딩 안 끝남 → 온보딩
  if (!session || !onboarded) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }
  // 로그인 + 온보딩 끝남 → 메인앱
  return <MainApp />;
}
