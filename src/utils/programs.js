import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// 자기 자치구 + 서울시 자료만 가져옴 (활성 자료만)
async function fetchPrograms(userGu) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .in("gu", [userGu, "서울시"])
    .gte("end_date", todayStr)
    .order("start_date", { ascending: true });

  if (error) throw error;

  // snake_case → camelCase 변환 (UI 결로 변경 안 되게)
  return (data || []).map((p) => ({
    id: p.id,
    gu: p.gu,
    title: p.title,
    startDate: p.start_date,
    endDate: p.end_date,
    link: p.link,
  }));
}

// 커스텀 훅: 우리 동네 탭에서 호출
export function usePrograms(userGu) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(!!userGu);
  const [error, setError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!userGu) {
      setLoading(false);
      setPrograms([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPrograms(userGu)
      .then((data) => {
        if (cancelled) return;
        setPrograms(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "불러오기 실패");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userGu, retryToken]);

  const retry = () => setRetryToken((n) => n + 1);

  return { programs, loading, error, retry };
}

// "5월 9일 시작" / "5월 1일부터"
export function formatStartDate(dateStr) {
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

// 자치구별 분리 (이미 자기 자치구 + 서울시 자료만 있음)
export function splitProgramsByGu(programs, gu) {
  const ours = programs.filter((p) => p.gu === gu);
  const city = programs.filter((p) => p.gu === "서울시");
  return { ours, city };
}
