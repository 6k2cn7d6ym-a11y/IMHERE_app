import { C, GU_LIST } from "../../lib/constants";

export default function GuModal({ currentGu, onSelect, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        <div style={{ padding: "24px 24px 16px" }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, color: C.sub, padding: 0, marginBottom: 12, cursor: "pointer" }}
          >
            ✕
          </button>
          <div style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 22, fontWeight: 400, lineHeight: 1.4, marginBottom: 6 }}>
            어느 동네로 <span style={{ color: C.warm }}>바꿀까요?</span>
          </div>
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, fontWeight: 300 }}>
            이사하셨거나 다른 동네 정보가 궁금하시면 바꾸셔도 돼요.
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GU_LIST.map((gu) => {
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
