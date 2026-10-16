import { ImageResponse } from "next/og";

export const alt = "Mizanur Hasan — Component Lab, interactive React interfaces";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "#f7f9fc",
        color: "#111827",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 25, fontWeight: 700 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "#4f68e8" }} />
        Component Lab
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: -3, lineHeight: 1.04 }}>
          Mizanur Hasan
        </div>
        <div style={{ fontSize: 34, color: "#4b5563" }}>
          Interactive interfaces, built with care.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22, color: "#596477" }}>
        <div style={{ width: 42, height: 4, borderRadius: 4, background: "#4f68e8" }} />
        React · Next.js · TypeScript
      </div>
    </div>,
    size,
  );
}
