import { C } from "../../lib/constants";

export default function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "20px 24px 0" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 2,
            borderRadius: 2,
            background: i < step ? C.warm : C.border,
            transition: "background .3s",
          }}
        />
      ))}
    </div>
  );
}
