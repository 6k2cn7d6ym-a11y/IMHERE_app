import { useState } from "react";
import { C } from "../../lib/constants";

export default function FeedTab({ posts, postsLoaded, toggleLike, toggleSave, onComposeOpen }) {
  const [filter, setFilter] = useState("전체");
  const tags = ["전체", "꿀팁", "감성", "일상"];
  const list = filter === "전체" ? posts : posts.filter((p) => p.tag === filter);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ padding: "32px 24px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 24, marginBottom: 4 }}>피드</div>
        <div style={{ fontSize: 12, color: C.sub, fontWeight: 300, marginBottom: 18 }}>1인가구들의 이야기</div>
        <div style={{ display: "flex", gap: 8 }}>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: "7px 16px",
                borderRadius: 40,
                fontSize: 12,
                border: `1px solid ${filter === t ? C.dark : C.border}`,
                background: filter === t ? C.dark : "transparent",
                color: filter === t ? "#fff" : C.muted,
                transition: "all .2s",
              }}
            >
              {t}
            </button>
          ))}
          <button
            onClick={onComposeOpen}
            style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 40, fontSize: 12, border: `1px solid ${C.warm}`, color: C.warm }}
          >
            + 올리기
          </button>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {!postsLoaded ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: C.muted, fontSize: 13, fontWeight: 300 }}>
            불러오는 중...
          </div>
        ) : list.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>🌿</div>
            <div style={{ fontSize: 14, color: C.sub, fontWeight: 300, lineHeight: 1.7 }}>
              {filter === "전체" ? "아직 글이 없어요." : `'${filter}' 글이 아직 없어요.`}<br />
              첫 이야기를 들려주실래요?
            </div>
            <button
              onClick={onComposeOpen}
              style={{ marginTop: 20, padding: "10px 22px", borderRadius: 40, fontSize: 12, border: `1px solid ${C.warm}`, color: C.warm }}
            >
              + 올리기
            </button>
          </div>
        ) : (
          list.map((post, i) => (
            <div
              key={post.id}
              className="up"
              style={{
                background: C.surface,
                borderRadius: 16,
                padding: "22px",
                marginBottom: 14,
                border: `1px solid ${C.border}`,
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {post.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{post.user}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{post.time}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10, padding: "4px 12px", borderRadius: 20, background: C.card, color: C.sub }}>{post.tag}</span>
              </div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.8, fontWeight: 300, marginBottom: 18, whiteSpace: "pre-wrap" }}>{post.content}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 20, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => toggleLike(post.id)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16, color: post.liked ? "#D4695A" : C.muted, transition: "color .2s" }}>♥</span>
                  <span style={{ fontSize: 13, color: post.liked ? C.warm : C.muted, fontWeight: post.liked ? 500 : 400 }}>{post.likes}</span>
                </button>
                <button onClick={() => toggleSave(post.id)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 15, color: post.savedByMe ? C.warm : C.muted, transition: "color .2s" }}>{post.savedByMe ? "★" : "☆"}</span>
                  <span style={{ fontSize: 13, color: post.savedByMe ? C.warm : C.muted, fontWeight: post.savedByMe ? 500 : 400 }}>{post.saved}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
