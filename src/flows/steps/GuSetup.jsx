import { C, GU_LIST } from "../../lib/constants";
import ProgressBar from "../../components/shared/ProgressBar";

export default function GuSetup({ selectedGu, setSelectedGu, next }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <ProgressBar step={2} total={3} />

      <div style={{ flex: 1, padding: "40px 28px 0", display: "flex", flexDirection: "column" }}>
        <div className="up" style={{ fontFamily: "'Noto Serif KR',serif", fontSize: 26, fontWeight: 400, lineHeight: 1.4, marginBottom: 8 }}>
          어느 동네에<br />
          <span style={{ color: C.warm }}>살고 계세요?</span>
        </div>
        <div className="up" style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginBottom: 28, lineHeight: 1.7 }}>
          우리 동네에 어떤 자원이 있는지 알려드릴게요.<br />언제든 바꿀 수 있어요.
        </div>

        <div className="up" style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GU_LIST.map((gu) => {
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

      <div style={{ padding: "20px 28px 52px", background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={next}
          disabled={!selectedGu}
          style={{
            width: "100%",
            background: selectedGu ? C.dark : C.border,
            color: "#fff",
            padding: "17px",
            borderRadius: 8,
            fontSize: 15,
            letterSpacing: 0.3,
            transition: "background .2s",
            cursor: selectedGu ? "pointer" : "default",
          }}
        >
          {selectedGu ? `${selectedGu}로 시작하기 →` : "동네를 골라주세요"}
        </button>
      </div>
    </div>
  );
}
