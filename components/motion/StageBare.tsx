"use client";

import { useEffect, useState } from "react";
import { demoRegistry } from "@/demos";
import type { ParamValues } from "@/lib/types";
import styles from "./StageBare.module.css";

// v2の裸デモ（/stage/<slug>/）。ステージをビューポートいっぱいに広げて描画する。
// 録画v2（scripts/record-v2.cjs）と、Framer詳細ページの iframe の両方で使う。
//
// Framerの詳細ページ(EntryLab)から iframe で埋め込まれたときは、親のスライダーの値を
// postMessage {type:"md:params", values} で受け取ってデモに流す（＝Tweak-Driven）。
// 受け取る値は初期値のキーだけに絞り、数値以外は捨てる。
export default function StageBare({
  slug,
  params,
}: {
  slug: string;
  params: ParamValues;
}) {
  const [values, setValues] = useState<ParamValues>(params);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || d.type !== "md:params" || typeof d.values !== "object") return;
      setValues((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(params)) {
          const v = Number(d.values[k]);
          if (Number.isFinite(v)) next[k] = v;
        }
        return next;
      });
    };
    addEventListener("message", onMsg);
    if (window.parent !== window) window.parent.postMessage({ type: "md:ready", slug }, "*");
    return () => removeEventListener("message", onMsg);
  }, [slug, params]);

  const Demo = demoRegistry[slug];
  if (!Demo) return null;
  return (
    <div className={styles.bareFill}>
      <Demo params={values} />
    </div>
  );
}
