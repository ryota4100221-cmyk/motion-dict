"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./BlurLoad.module.css";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCE_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCE_QUERY).matches,
    () => false
  );
}

export default function BlurLoad({ params }: { params: ParamValues }) {
  // loadedRun===run のとき「読み込み完了」。runを進めるとリプレイになる
  const [loadedRun, setLoadedRun] = useState(-1);
  const [run, setRun] = useState(0);
  const reduce = useReducedMotion();
  const loaded = loadedRun === run;

  // 疑似ネットワーク遅延。実装では固定タイマーではなく本画像のonloadがトリガー
  useEffect(() => {
    const t = setTimeout(() => setLoadedRun(run), 900);
    return () => clearTimeout(t);
  }, [run]);

  // scale(1.06)はblurで滲んだ縁を枠外に追い出すための併用。
  // reduced-motion時はトランジションなしで即時切り替え
  const imgStyle: CSSProperties = {
    filter: loaded ? "blur(0px)" : `blur(${params.blur}px)`,
    transform: loaded ? "scale(1)" : "scale(1.06)",
    transitionDuration: reduce ? "0s" : `${params.duration}s`,
  };

  return (
    <DemoStage hint="クリック / タップで読み込みをリプレイ">
      <figure className={styles.card} onClick={() => setRun((r) => r + 1)}>
        <div className={styles.frame}>
          <div className={styles.img} style={imgStyle} />
        </div>
        <figcaption className={styles.caption}>
          Fig.04 — blur-up study {loaded ? "(loaded)" : "(loading…)"}
        </figcaption>
      </figure>
    </DemoStage>
  );
}
