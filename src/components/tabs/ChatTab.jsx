import { useState, useEffect, useRef } from "react";
import { C } from "../../lib/constants";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import OrosiChat from "./OrosiChat";
import DistrictChat from "./DistrictChat";

// 채팅 탭 wrapper
// - 오로시 채널: 부모(MainApp)에서 props로 messages·sendMessage 등 받음
// - 자치구 채널: 자체 fetch + realtime 구독으로 관리
// - 발급번호 연결 안 된 사용자는 자치구 탭 자체 안 보임
export default function ChatTab({ messages, input, setInput, sendMessage, typing, bottomRef, userGu }) {
  const { user, profile } = useAuth();
  const userId = user?.id || null;
  const verifiedAt = profile?.verified_at || null;

  const [activeChannel, setActiveChannel] = useState("orosi");
  const [adminId, setAdminId] = useState(null);
  const [districtMessages, setDistrictMessages] = useState([]);
  const [districtUnread, setDistrictUnread] = useState(0);
  const [districtReady, setDistrictReady] = useState(false);

  // realtime 핸들러에서 최신 activeChannel 참조용
  const activeChannelRef = useRef(activeChannel);
  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  // adminId 조회 + 메시지 fetch + realtime 구독
  useEffect(() => {
    if (!userId || !verifiedAt) {
      setAdminId(null);
      setDistrictMessages([]);
      setDistrictUnread(0);
      setDistrictReady(true);
      return;
    }

    let cancelled = false;
    let channel = null;

    (async () => {
      try {
        // 1. 자치구 admin ID 조회 — get_district_admin_id_for_user RPC (SECURITY DEFINER)
        const { data: adminUuid, error: adminErr } = await supabase
          .rpc("get_district_admin_id_for_user");

        if (cancelled) return;

        if (adminErr) {
          console.error("자치구 admin 조회 실패:", adminErr);
          setAdminId(null);
          setDistrictReady(true);
          return;
        }

        const foundAdminId = adminUuid || null;
        if (!foundAdminId) {
          setAdminId(null);
          setDistrictReady(true);
          return;
        }
        setAdminId(foundAdminId);

        // 2. 메시지 fetch — sender·receiver 모두 [me, admin] 안에 있는 행
        // (me→me, admin→admin은 실제로 안 생기므로 결과는 me↔admin 양방향만)
        const { data: msgs, error: msgErr } = await supabase
          .from("district_chats")
          .select("*")
          .eq("is_invitation", false)
          .in("sender_id", [userId, foundAdminId])
          .in("receiver_id", [userId, foundAdminId])
          .order("created_at", { ascending: true });

        if (cancelled) return;
        if (msgErr) {
          console.error("자치구 메시지 불러오기 실패:", msgErr);
          setDistrictReady(true);
          return;
        }

        const list = msgs || [];
        setDistrictMessages(list);
        const unread = list.filter((m) => m.sender_id === foundAdminId && !m.read_at).length;
        setDistrictUnread(unread);
        setDistrictReady(true);

        // 3. realtime 구독 — admin → me 방향만 (내가 보낸 건 INSERT 결과로 직접 추가)
        channel = supabase
          .channel(`district_chats:${userId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "district_chats",
              filter: `receiver_id=eq.${userId}`,
            },
            (payload) => {
              const msg = payload.new;
              if (!msg || msg.is_invitation) return;
              if (msg.sender_id !== foundAdminId) return;
              setDistrictMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              if (activeChannelRef.current === "district") {
                // 활성 탭이면 즉시 read 처리
                markOneRead(msg.id);
              } else {
                setDistrictUnread((n) => n + 1);
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.error("자치구 채널 초기화 실패:", e);
        setDistrictReady(true);
      }
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, verifiedAt]);

  // 단일 메시지 read 처리
  const markOneRead = async (id) => {
    const now = new Date().toISOString();
    setDistrictMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read_at: now } : m))
    );
    try {
      await supabase
        .from("district_chats")
        .update({ read_at: now })
        .eq("id", id);
    } catch (e) {
      console.error("read 갱신 실패:", e);
    }
  };

  // 자치구 탭 진입 — 미읽음 전체 read 처리
  const switchToDistrict = async () => {
    setActiveChannel("district");
    if (districtUnread === 0 || !adminId) return;
    const now = new Date().toISOString();
    setDistrictMessages((prev) =>
      prev.map((m) =>
        m.sender_id === adminId && !m.read_at ? { ...m, read_at: now } : m
      )
    );
    setDistrictUnread(0);
    try {
      await supabase
        .from("district_chats")
        .update({ read_at: now })
        .eq("receiver_id", userId)
        .eq("sender_id", adminId)
        .is("read_at", null);
    } catch (e) {
      console.error("read 일괄 갱신 실패:", e);
    }
  };

  // DistrictChat이 메시지 보낸 후 콜백
  const handleDistrictSent = (newMsg) => {
    setDistrictMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  };

  const showDistrictTab = !!adminId;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 76px)" }}>
      {/* 탭 바 — 자치구 가능할 때만 */}
      {showDistrictTab && (
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          <button
            onClick={() => setActiveChannel("orosi")}
            style={{
              flex: 1,
              padding: "12px 0",
              fontSize: 13,
              fontWeight: activeChannel === "orosi" ? 500 : 400,
              color: activeChannel === "orosi" ? C.warm : C.muted,
              borderBottom: activeChannel === "orosi" ? `2px solid ${C.warm}` : "2px solid transparent",
              background: "transparent",
              transition: "color .15s, border-color .15s",
            }}
          >
            오로시
          </button>
          <button
            onClick={switchToDistrict}
            style={{
              flex: 1,
              padding: "12px 0",
              fontSize: 13,
              fontWeight: activeChannel === "district" ? 500 : 400,
              color: activeChannel === "district" ? C.warm : C.muted,
              borderBottom: activeChannel === "district" ? `2px solid ${C.warm}` : "2px solid transparent",
              background: "transparent",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "color .15s, border-color .15s",
            }}
          >
            <span>{userGu} 담당자</span>
            {districtUnread > 0 && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#D4695A",
                  display: "inline-block",
                }}
                aria-label={`안 읽은 메시지 ${districtUnread}개`}
              />
            )}
          </button>
        </div>
      )}

      {/* 채널별 본문 */}
      {(!showDistrictTab || activeChannel === "orosi") && (
        <OrosiChat
          messages={messages}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          typing={typing}
          bottomRef={bottomRef}
          userGu={userGu}
        />
      )}
      {showDistrictTab && activeChannel === "district" && (
        <DistrictChat
          messages={districtMessages}
          adminId={adminId}
          userGu={userGu}
          userId={userId}
          onSent={handleDistrictSent}
        />
      )}
    </div>
  );
}
