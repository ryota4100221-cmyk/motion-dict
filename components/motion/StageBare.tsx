"use client";

import { useEffect, useRef, useState } from "react";
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
  // 値が落ち着いたら（350ms）デモを作り直して頭から再生する＝値を変えた結果がその場で見える。
  // 自動再生しないデモ（Play押下型）でも、初期状態に戻るので押し直しの手がかりになる。
  const [gen, setGen] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || d.type !== "md:params" || typeof d.values !== "object") return;
      let changed = false;
      setValues((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(params)) {
          const v = Number(d.values[k]);
          if (Number.isFinite(v) && v !== prev[k]) { next[k] = v; changed = true; }
        }
        return changed ? next : prev;
      });
      if (d.replay) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setGen((g) => g + 1), 350);
      }
    };
    addEventListener("message", onMsg);
    // 親（EntryLab）に「触られた」を知らせる＝録画の重ねを外してライブに切り替える。タッチは親から見えないため
    const touched = () => window.parent.postMessage({ type: "md:interact", slug }, "*");
    if (window.parent !== window) {
      window.parent.postMessage({ type: "md:ready", slug }, "*");
      addEventListener("pointerdown", touched, true);
      addEventListener("wheel", touched, { capture: true, passive: true });
    }
    return () => {
      removeEventListener("message", onMsg);
      removeEventListener("pointerdown", touched, true);
      removeEventListener("wheel", touched, true);
    };
  }, [slug, params]);

  const Demo = demoRegistry[slug];
  if (!Demo) return null;
  return (
    <div className={styles.bareFill}>
      <Demo key={gen} params={values} />
    </div>
  );
}
