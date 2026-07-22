"use client";

import { demoRegistry } from "@/demos";
import type { ParamValues } from "@/lib/types";
import styles from "./DemoBare.module.css";

// デモ単体を全画面・暗色で描画する器。デモ本体(DemoStage)を画面いっぱいに
// 充填し、周囲に明るい余白を作らない（録画に#F4F4F1が写り込むのを防ぐ）。
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
    <div className={styles.bareFill}>
      <Demo params={params} />
    </div>
  );
}
