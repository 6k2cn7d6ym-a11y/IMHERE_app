import { useState, useRef, useEffect } from "react";
import { C } from "../../lib/constants";
import { supabase } from "../../lib/supabase";

// 자치구 채팅 — 사용자 ↔ 발급번호 발행자(담당자) 직접 대화
// messages·realtime 관리는 부모 ChatTab에서. 이 컴포넌트는 표시·전송만 담당.
// 보낸 메시지는 onSent 콜백으로 부모에게 알려서 messages에 추가.
export default function DistrictChat({ messages, adminId, userGu, userId, onSent }) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("district_chats")
        .insert({
          sender_id: userId,
          receiver_id: adminId,
          content,
          is_invitation: false,
        })
        .select()
        .single();
      if (error) throw error;
      if (typeof onSent === "function" && data) onSent(data);
      setInput("");
    } catch (e) {
      console.error("자치구 메시지 전송 실패:", e);
      alert("전송 실패. 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adminLabel = `${userGu} 담당자`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* 헤더 */}
      <div style={{ padding: "20px 24px 18px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 22, marginBottom: 5 }}>
          {userGu} 1인가구 정서지원사업
        </div>
        <div style={{ fontSize: 12, color: C.warm, fontWeight: 300 }}>담당자와 직접 대화</div>
      </div>

      {/* 메시지 목록 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 0" }}>
        {messages.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>💬</div>
            <div style={{ fontSize: 13, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
              아직 대화가 없어요.<br />
              담당자에게 첫 메시지를 보내보세요.
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className="up"
                style={{
                  marginBottom: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMine ? "flex-end" : "flex-start",
                }}
              >
                {!isMine && (
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{adminLabel}</div>
                )}
                <div
                  style={{
                    maxWidth: "76%",
                    padding: "13px 17px",
                    borderRadius: isMine ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
                    background: isMine ? C.dark : C.warmLight,
                    color: isMine ? "#fff" : C.text,
                    fontSize: 14,
                    lineHeight: 1.8,
                    fontWeight: 300,
                    whiteSpace: "pre-line",
                    boxShadow: isMine ? "none" : "0 2px 12px rgba(26,16,10,.06)",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div style={{ padding: "14px 20px 22px", borderTop: `1px solid ${C.border}`, background: C.bg }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="담당자에게 보낼 메시지..."
            rows={2}
            disabled={sending}
            style={{
              flex: 1,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: "13px 16px",
              fontSize: 14,
              color: C.text,
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: input.trim() && !sending ? C.dark : C.border,
              color: "#fff",
              fontSize: 17,
              flexShrink: 0,
              transition: "background .2s",
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
