"use client";

import { demoRegistry } from "@/demos";
import type { ParamValues } from "@/lib/types";

// デモ単体を全画面中央に描画するだけの器。
// 録画（Playwright）とGitHub Pagesのライブデモの両方で使う。
export default function DemoBare({
  slug,
  params,
}: {
  slug: string;
  params: ParamValues;
}) {
  const Demo = demoRegistry[slug];
  if (!Demo) return null;
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#F4F4F1",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900 }}>
        <Demo params={params} />
      </div>
    </div>
  );
}
