// IMHERE — sync-programs Edge Function
// 서울 OpenAPI 5페이지를 병렬 호출 → filter → programs 테이블에 upsert.
// 수동 실행 또는 Supabase Cron으로 매일 자동 sync.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// 정서 카테고리 키워드
const EMOTION_KEYWORDS = [
  "마음", "감정", "정서", "심리", "우울", "외로움",
  "고립", "스트레스", "명상", "힐링", "치유", "위로",
  "공감", "자존감", "관계", "고독",
];

function matchEmotion(row: any) {
  if (row.SE_NM === "외로움") return true;
  if (row.SE_NM !== "기타") return false;
  const title = row.PARTCPTN_SJ || "";
  return EMOTION_KEYWORDS.some((k) => title.includes(k));
}

function isActive(row: any) {
  const end = row.PROGRS_DE2;
  if (!end) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return end >= todayStr;
}

async function fetchPage(apiKey: string, start: number, end: number) {
  const url = `http://openapi.seoul.go.kr:8088/${apiKey}/json/tbPartcptn/${start}/${end}/`;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAPI_KEY = Deno.env.get("SEOUL_OPENAPI_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!OPENAPI_KEY) throw new Error("SEOUL_OPENAPI_KEY not set");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Supabase env not set");
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const PAGE_SIZE = 1000;

    // 첫 페이지 (total 알기 위해)
    const first = await fetchPage(OPENAPI_KEY, 1, PAGE_SIZE);
    let allRows = first.rows;
    const total = first.total;

    // 나머지 페이지 병렬 호출
    if (total > PAGE_SIZE) {
      const remainingPages = Math.ceil((total - PAGE_SIZE) / PAGE_SIZE);
      const promises = [];
      for (let i = 0; i < remainingPages; i++) {
        const s = PAGE_SIZE * (i + 1) + 1;
        const e = Math.min(PAGE_SIZE * (i + 2), total);
        promises.push(fetchPage(OPENAPI_KEY, s, e));
      }
      const results = await Promise.all(promises);
      for (const r of results) {
        allRows = allRows.concat(r.rows);
      }
    }

    // filter + normalize
    const programs = allRows
      .filter((r: any) => matchEmotion(r) && isActive(r))
      .map((r: any) => ({
        id: r.PARTCPTN_ID,
        gu: r.ATDRC_NM,
        title: (r.PARTCPTN_SJ || "").trim(),
        start_date: r.PROGRS_DE1 || null,
        end_date: r.PROGRS_DE2 || null,
        link: r.RCEPT_MTH_LINK || null,
        updated_at: new Date().toISOString(),
      }));

    // upsert (배치 500개씩 — 진짜 큰 자료 결로 안전)
    let upsertedTotal = 0;
    const BATCH = 500;
    for (let i = 0; i < programs.length; i += BATCH) {
      const batch = programs.slice(i, i + BATCH);
      const { error } = await supabase
        .from("programs")
        .upsert(batch, { onConflict: "id" });
      if (error) throw error;
      upsertedTotal += batch.length;
    }

    // 옛 자료 (종료된 거) 정리
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const { error: delError, count: delCount } = await supabase
      .from("programs")
      .delete({ count: "exact" })
      .lt("end_date", todayStr);

    if (delError) console.error("Delete error:", delError);

    return new Response(
      JSON.stringify({
        synced: upsertedTotal,
        deleted: delCount || 0,
        raw_total: total,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message || "sync failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
