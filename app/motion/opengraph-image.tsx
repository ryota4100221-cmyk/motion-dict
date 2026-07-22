import { ImageResponse } from "next/og";

export const dynamic = "force-static";
import { loadGoogleFont, og } from "@/lib/og";

export const alt = "動きの伝え方辞典 — monaka design.";
export const size = { width: og.width, height: og.height };
export const contentType = "image/png";

const TITLE = "動きの伝え方辞典";
const TAGLINE = "「あの動き」に名前と数値を。AIに正確に伝えるための対訳辞典。";
const MONO_TEXT = "Motion dictionary monaka design. Index —";

export default async function Image() {
  const [serif, mono] = await Promise.all([
    loadGoogleFont("Noto Sans JP", 900, TITLE + TAGLINE),
    loadGoogleFont("IBM Plex Mono", 400, MONO_TEXT),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: og.paper,
          color: og.sumi,
          padding: "64px 72px",
          fontFamily: "NotoSansJP",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "IBMPlexMono",
            fontSize: 22,
            letterSpacing: "0.14em",
            color: og.sumiSoft,
          }}
        >
          <span
            style={{
              backgroundColor: og.ai,
              color: og.sumi,
              padding: "4px 14px",
            }}
          >
            Index
          </span>
          <span style={{ margin: "0 16px" }}>—</span>
          <span>Motion dictionary</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: "-0.01em" }}>
            {TITLE}
          </div>
          <div style={{ fontSize: 30, color: og.sumiSoft, letterSpacing: "0.04em" }}>
            {TAGLINE}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `1px solid ${og.line}`,
            paddingTop: 28,
            fontFamily: "IBMPlexMono",
            fontSize: 20,
            letterSpacing: "0.14em",
            color: og.sumiSoft,
          }}
        >
          <span>Motion dictionary</span>
          <span>monaka design.</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NotoSansJP", data: serif, weight: 900, style: "normal" },
        { name: "IBMPlexMono", data: mono, weight: 400, style: "normal" },
      ],
    }
  );
}
