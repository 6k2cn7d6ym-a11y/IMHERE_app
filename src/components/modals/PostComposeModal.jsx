import { useState } from "react";
import { C } from "../../lib/constants";

export default function PostComposeModal({ onClose, onSubmit }) {
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("일상");
  const [submitting, setSubmitting] = useState(false);
  const tags = ["꿀팁", "감성", "일상"];

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(content, tag);
    setSubmitting(false);
    if (ok) onClose();
    else alert("글 올리기 실패. 다시 시도해주세요.");
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: C.bg, zIndex: 200,
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onClose} style={{ fontSize: 22, color: C.sub, padding: 4 }}>←</button>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 17 }}>새 이야기</div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          style={{
            fontSize: 13,
            color: content.trim() && !submitting ? C.warm : C.muted,
            fontWeight: 500,
            padding: "4px 8px",
          }}
        >
          {submitting ? "올리는 중..." : "올리기"}
        </button>
      </div>

      <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 400, marginBottom: 8 }}>분위기</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              style={{
                padding: "8px 16px",
                borderRadius: 40,
                fontSize: 12,
                border: `1px solid ${tag === t ? C.dark : C.border}`,
                background: tag === t ? C.dark : "transparent",
                color: tag === t ? "#fff" : C.muted,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="어떤 이야기를 들려주실래요?"
          maxLength={500}
          rows={10}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            fontFamily: "inherit",
            fontSize: 14,
            color: C.text,
            lineHeight: 1.8,
            resize: "none",
            outline: "none",
          }}
        />

        <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, textAlign: "right", marginTop: 12 }}>
          {content.length} / 500
        </div>
      </div>
    </div>
  );
}
