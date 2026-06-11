import { ImageResponse } from "next/og";

// File-convention 1200x630 OpenGraph image for the whole site.
// Brand: emerald + ShieldCheck glyph, mirroring the live site's identity.
export const alt = "Amanah — AI triage copilot for campaign trust & safety";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0f766e 100%)",
          color: "#faf8f4",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "80px",
          }}
        >
          {/* ShieldCheck glyph (lucide) on a translucent tile */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              background: "rgba(255, 255, 255, 0.14)",
              borderRadius: 28,
              marginBottom: 40,
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#faf8f4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 80, fontWeight: 700, marginBottom: 16 }}>
            Amanah
          </div>
          <div style={{ display: "flex", fontSize: 34, opacity: 0.95, marginBottom: 28 }}>
            AI reads every campaign. People make every call.
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255, 255, 255, 0.14)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 10,
                height: 10,
                borderRadius: 5,
                background: "#fbbf24",
              }}
            />
            <div style={{ display: "flex" }}>
              Demo · real AI pipeline, fictional campaigns
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 60,
            fontSize: 24,
            opacity: 0.85,
          }}
        >
          amanah.micbun.com
        </div>
      </div>
    ),
    { ...size }
  );
}
