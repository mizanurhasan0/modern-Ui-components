import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

type OgCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer: string;
};

/** Shortens at a word boundary so a card never ends mid-word. */
function clamp(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max / 2)).trimEnd().replace(/[,.;:]$/, "")}…`;
}

/** The 1200×630 social card used by detail pages, matching the home page card. */
export function renderOgCard({ eyebrow, title, description, footer }: OgCardProps) {
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
        <div style={{ display: "flex", marginLeft: 8, fontSize: 20, fontWeight: 500, color: "#596477" }}>· {eyebrow}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", fontSize: title.length > 28 ? 62 : 76, fontWeight: 800, letterSpacing: -3, lineHeight: 1.04 }}>
          {clamp(title, 56)}
        </div>
        <div style={{ display: "flex", fontSize: 30, lineHeight: 1.4, color: "#4b5563" }}>{clamp(description, 130)}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 22, color: "#596477" }}>
        <div style={{ width: 42, height: 4, borderRadius: 4, background: "#4f68e8" }} />
        {footer}
      </div>
    </div>,
    ogSize,
  );
}
