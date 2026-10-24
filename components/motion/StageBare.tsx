"use client";

import { useEffect, useRef, useState } from "react";
import { demoRegistry } from "@/demos";
import type { ParamValues } from "@/lib/types";
import { playSpec, type RecSpec } from "@/lib/stagePlayer";
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
  // 録画の台本（同じ操作をライブでも流す）と、その zoom（録画と同じ大きさで見せる）
  const [spec, setSpec] = useState<RecSpec | null>(null);
  const player = useRef<{ abort: () => void } | null>(null);
  const pendingPlay = useRef(false);
  useEffect(() => {
    fetch(`/motion-dict/rec/${slug}.json`).then((r) => (r.ok ? r.json() : null)).then(setSpec).catch(() => {});
  }, [slug]);
  // 作り直し（gen）の直後に台本を流す
  useEffect(() => {
    if (!pendingPlay.current || !spec) return;
    pendingPlay.current = false;
    const t = setTimeout(() => {
      player.current?.abort();
      player.current = playSpec(spec);
    }, Math.min(spec.settle ?? 600, 900));
    return () => clearTimeout(t);
  }, [gen, spec]);

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
        player.current?.abort();
        timer.current = setTimeout(() => { pendingPlay.current = true; setGen((g) => g + 1); }, 350);
      }
    };
    // 「▶ 動きを再生」：値は変えずに頭から台本を流す
    const onDemo = (ev: MessageEvent) => {
      if (!ev.data || ev.data.type !== "md:demo") return;
      player.current?.abort();
      pendingPlay.current = true;
      setGen((g) => g + 1);
    };
    addEventListener("message", onDemo);
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
      removeEventListener("message", onDemo);
      removeEventListener("pointerdown", touched, true);
      removeEventListener("wheel", touched, true);
    };
  }, [slug, params]);

  const Demo = demoRegistry[slug];
  if (!Demo) return null;
  return (
    <div className={styles.bareFill}>
      {spec?.zoom && spec.zoom !== 1 ? (
        <style>{`[data-md-stage] > *:not([data-md-hint]){zoom:${spec.zoom}}`}</style>
      ) : null}
      <Demo key={gen} params={values} />
    </div>
  );
}
