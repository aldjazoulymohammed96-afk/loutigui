import { ImageResponse } from "next/og";

export const alt = "LOUTIGUI — Vos loyers rentrent à l'heure. Vos preuves aussi.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Deterministic OG card: no external font or image fetch, safe on serverless. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)",
          color: "#f8fafc",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              background: "#34d399",
              color: "#052e16",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            L
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1 }}>LOUTIGUI</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, maxWidth: 960 }}>
            Vos loyers rentrent à l&apos;heure.
          </div>
          <div style={{ fontSize: 44, color: "#6ee7b7", fontWeight: 600 }}>
            Vos preuves aussi.
          </div>
          <div style={{ fontSize: 26, color: "#cbd5e1", maxWidth: 900 }}>
            Encaissements Mobile Money, quittances vérifiables par QR code et baux professionnels.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#94a3b8" }}>
          loutigui.vercel.app/landing
        </div>
      </div>
    ),
    size
  );
}
