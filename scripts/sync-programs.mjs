// IMHERE — programs sync script
// 로컬 결로 한 번 실행. 서울 OpenAPI 자료를 Supabase programs 테이블에 박음.
//
// 실행 결로:
//   SUPABASE_SERVICE_ROLE_KEY="값" node scripts/sync-programs.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hofztiuqojzimfwlfvts.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAPI_KEY = "686752756c6b6a6939365446737952";

if (!SERVICE_ROLE_KEY) {
  console.error("\n❌ SUPABASE_SERVICE_ROLE_KEY 환경변수가 박혀있지 않아요.");
  console.error("\n실행 결로:");
  console.error(
    '  SUPABASE_SERVICE_ROLE_KEY="값" node scripts/sync-programs.mjs\n'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const EMOTION_KEYWORDS = [
  "마음", "감정", "정서", "심리", "우울", "외로움",
  "고립", "스트레스", "명상", "힐링", "치유", "위로",
  "공감", "자존감", "관계", "고독",
];

function matchEmotion(row) {
  if (row.SE_NM === "외로움") return true;
  if (row.SE_NM !== "기타") return false;
  const title = row.PARTCPTN_SJ || "";
  return EMOTION_KEYWORDS.some((k) => title.includes(k));
}

function isActive(row, todayStr) {
  const end = row.PROGRS_DE2;
  if (!end) return false;
  return end >= todayStr;
}

function normalize(row) {
  return {
    id: row.PARTCPTN_ID,
    gu: row.ATDRC_NM,
    title: (row.PARTCPTN_SJ || "").trim(),
    start_date: row.PROGRS_DE1 || null,
    end_date: row.PROGRS_DE2 || null,
    link: row.RCEPT_MTH_LINK || null,
    updated_at: new Date().toISOString(),
  };
}

async function fetchPage(start, end) {
  const url = `http://openapi.seoul.go.kr:8088/${OPENAPI_KEY}/json/tbPartcptn/${start}/${end}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Seoul API ${res.status}`);
  const json = await res.json();
  const payload = json.tbPartcptn;
  if (!payload) throw new Error("Invalid API response");
  if (payload.RESULT && payload.RESULT.CODE !== "INFO-000") {
    throw new Error(`API: ${payload.RESULT.MESSAGE}`);
  }
  return {
    total: payload.list_total_count || 0,
    rows: payload.row || [],
  };
}

async function main() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  console.log("\n=== IMHERE programs sync ===\n");
  console.log("서울 API에서 자료 받는 중...");

  const PAGE_SIZE = 1000;

  // 첫 페이지 (total 알기)
  const first = await fetchPage(1, PAGE_SIZE);
  const total = first.total;
  console.log(`전체 자료: ${total}건`);

  let allPrograms = first.rows
    .filter((r) => matchEmotion(r) && isActive(r, todayStr))
    .map(normalize);

  // 나머지 페이지 (순차)
  if (total > PAGE_SIZE) {
    const pages = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE);
    for (let i = 0; i < pages; i++) {
      const s = PAGE_SIZE * (i + 1) + 1;
      const e = Math.min(PAGE_SIZE * (i + 2), total);
      console.log(`페이지 ${i + 2}/${pages + 1} (${s}~${e}) 받는 중...`);
      const page = await fetchPage(s, e);
      const programs = page.rows
        .filter((r) => matchEmotion(r) && isActive(r, todayStr))
        .map(normalize);
      allPrograms = allPrograms.concat(programs);
    }
  }

  console.log(`\nfilter 후 활성 자료: ${allPrograms.length}건`);

  if (allPrograms.length === 0) {
    console.log("자료 없음. 끝.");
    return;
  }

  // 자치구별 자료 개수 (검증 결)
  const byGu = {};
  for (const p of allPrograms) {
    byGu[p.gu] = (byGu[p.gu] || 0) + 1;
  }
  console.log("자치구별:", byGu);

  // upsert (배치 100개씩)
  console.log("\nSupabase에 자료 박는 중...");
  const BATCH = 100;
  let synced = 0;
  for (let i = 0; i < allPrograms.length; i += BATCH) {
    const batch = allPrograms.slice(i, i + BATCH);
    const { error } = await supabase
      .from("programs")
      .upsert(batch, { onConflict: "id" });
    if (error) {
      console.error("upsert 에러:", error);
      throw error;
    }
    synced += batch.length;
    console.log(`upsert: ${synced}/${allPrograms.length}`);
  }

  // 옛 자료 정리
  console.log("\n옛 자료 정리 중...");
  const { error: delError, count: delCount } = await supabase
    .from("programs")
    .delete({ count: "exact" })
    .lt("end_date", todayStr);

  if (delError) {
    console.error("delete 에러:", delError);
  } else {
    console.log(`옛 자료 ${delCount || 0}건 삭제`);
  }

  console.log("\n=== 진짜 끝 ===\n");
}

main().catch((e) => {
  console.error("\n❌ 에러:", e.message);
  process.exit(1);
});
