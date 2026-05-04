// ═══════════════════════════════════════════════════════════
// AuthContext — 세션 + 프로필 단일 관리
// ═══════════════════════════════════════════════════════════
//
// 핵심 규칙:
// 1. onAuthStateChange 콜백 안에서는 절대 await 안 함 (lock deadlock 방지)
// 2. 프로필 fetch는 별도 useEffect에서 (session 변화 감지)
// 3. supabase.auth.getUser() 직접 호출 금지 — useAuth() 통해서만
// 4. 탭 전환 시 TOKEN_REFRESHED 와도 화면 안 바뀜 (initialized 한 번 박으면 끝)

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./supabase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // 같은 user_id 중복 fetch 방지용
  const lastFetchedUserId = useRef(null);

  // ── 1. 첫 진입: 로컬에서 세션 읽음 (네트워크 X) ──
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setInitialized(true);
    }).catch((e) => {
      console.error("[AUTH] getSession 실패:", e);
      if (mounted) setInitialized(true); // 실패해도 일단 진행 (guest로)
    });

    // ── 2. 변화 감지 — 콜백 안에서 절대 await/async 작업 X ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        // 같은 세션이면 setState 스킵 (불필요한 리렌더 방지)
        // event 종류: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION
        // 탭 전환 후 TOKEN_REFRESHED 자주 발생 — 콜백 안에선 그냥 setState만
        setSession(newSession);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── 3. session 박히면 프로필 fetch (별도 effect, lock 안 걸림) ──
  useEffect(() => {
    const userId = session?.user?.id || null;

    if (!userId) {
      setProfile(null);
      lastFetchedUserId.current = null;
      return;
    }

    // 같은 user 재 fetch 방지 (TOKEN_REFRESHED로 session 객체만 바뀐 경우)
    if (lastFetchedUserId.current === userId) return;
    lastFetchedUserId.current = userId;

    let cancelled = false;
    setProfileLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*") // 전체 컬럼 — Settings, MyPage 등 어디서든 받아씀
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("[AUTH] 프로필 fetch 에러:", error);
          setProfile(null);
        } else {
          setProfile(data); // null 가능 (행 아직 없음 = setup 필요)
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[AUTH] 프로필 fetch 예외:", e);
          setProfile(null);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [session?.user?.id]);

  // ── refreshProfile: SetupFlow / Settings 에서 update 후 호출 ──
  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[AUTH] refreshProfile 에러:", error);
        return null;
      }
      setProfile(data);
      return data;
    } catch (e) {
      console.error("[AUTH] refreshProfile 예외:", e);
      return null;
    }
  }, [session?.user?.id]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    initialized,    // 첫 세션 체크 끝났는지
    profileLoading, // 프로필 fetching 중
    refreshProfile,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 안에서만 호출 가능");
  }
  return ctx;
}
