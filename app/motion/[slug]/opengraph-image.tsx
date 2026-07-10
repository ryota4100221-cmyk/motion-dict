import { ImageResponse } from "next/og";
import { categoryLabels, entries } from "@/content";
import { loadGoogleFont, og } from "@/lib/og";

export const alt = "動きの伝え方辞典 — monaka design.";
export const size = { width: og.width, height: og.height };
export const contentType = "image/png";

export function generateStaticParams() {
  return Object.keys(entries).map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = entries[slug];
  const title = entry?.nameJa ?? "動きの伝え方辞典";
  const en = entry?.nameEn ?? "";
  const category = entry ? categoryLabels[entry.category] : "INDEX";

  const monoText = `${en} ${category} MOTION DICTIONARY monaka design. —`;
  const [serif, mono] = await Promise.all([
    loadGoogleFont("Noto Sans JP", 900, title + "動きの伝え方辞典"),
    loadGoogleFont("IBM Plex Mono", 400, monoText),
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
            {category}
          </span>
          <span style={{ margin: "0 16px" }}>—</span>
          <span style={{ fontFamily: "NotoSansJP" }}>動きの伝え方辞典</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 88, fontWeight: 900, letterSpacing: "-0.01em" }}>
            {title}
          </div>
          <div
            style={{
              fontFamily: "IBMPlexMono",
              fontSize: 28,
              color: og.sumiSoft,
              letterSpacing: "0.08em",
            }}
          >
            {en}
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
          <span>MOTION DICTIONARY</span>
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
