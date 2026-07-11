"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import DemoStage from "@/components/motion/DemoStage";
import type { ParamValues } from "@/lib/types";
import styles from "./Lightbox.module.css";

const THUMBS = [
  "/demo/dummy-01.svg",
  "/demo/dummy-02.svg",
  "/demo/dummy-03.svg",
];

const EASE = "cubic-bezier(0.33, 1, 0.68, 1)"; // ease-out

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

export default function Lightbox({ params }: { params: ParamValues }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const largeRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const animsRef = useRef<Animation[]>([]);
  const busyRef = useRef(false);
  const pendingOpenRef = useRef(false); // クリック直後の1回だけ開きFLIPを走らせる
  const reduce = useReducedMotion();

  useEffect(() => () => animsRef.current.forEach((a) => a.cancel()), []);

  const open = (i: number) => {
    if (busyRef.current || openIdx !== null) return;
    // reduced-motion: FLIPせず即時表示(オーバーレイは最初からdimの濃さ)
    pendingOpenRef.current = !reduce;
    setOpenIdx(i);
  };

  // 表示直後(paint前)にFLIP: サムネ(First)→中央(Last)の差分から再生
  useLayoutEffect(() => {
    if (openIdx === null || !pendingOpenRef.current) return;
    pendingOpenRef.current = false;
    const thumb = thumbRefs.current[openIdx];
    const large = largeRef.current;
    const backdrop = backdropRef.current;
    if (!thumb || !large || !backdrop) return;

    const first = thumb.getBoundingClientRect();
    const last = large.getBoundingClientRect();
    const ms = params.duration * 1000;
    busyRef.current = true;
    const zoom = large.animate(
      [
        {
          transform: `translate(${first.left - last.left}px, ${
            first.top - last.top
          }px) scale(${first.width / last.width}, ${
            first.height / last.height
          })`,
        },
        { transform: "none" },
      ],
      { duration: ms, easing: EASE }
    );
    const fade = backdrop.animate([{ opacity: 0 }, { opacity: params.dim }], {
      duration: ms,
      easing: "ease-out",
    });
    animsRef.current = [zoom, fade];
    zoom.onfinish = () => {
      busyRef.current = false;
    };
  }, [openIdx, params.duration, params.dim]);

  const close = () => {
    if (busyRef.current || openIdx === null) return;
    // reduced-motion: 逆再生せず即時クローズ
    if (reduce) {
      setOpenIdx(null);
      return;
    }
    const thumb = thumbRefs.current[openIdx];
    const large = largeRef.current;
    const backdrop = backdropRef.current;
    if (!thumb || !large || !backdrop) {
      setOpenIdx(null);
      return;
    }
    busyRef.current = true;
    const first = thumb.getBoundingClientRect();
    const last = large.getBoundingClientRect();
    const ms = params.duration * 1000;
    // 開きと同じ経路の逆再生。unmountされるまでfill: forwardsで終端を保持
    const zoom = large.animate(
      [
        { transform: "none" },
        {
          transform: `translate(${first.left - last.left}px, ${
            first.top - last.top
          }px) scale(${first.width / last.width}, ${
            first.height / last.height
          })`,
        },
      ],
      { duration: ms, easing: EASE, fill: "forwards" }
    );
    const fade = backdrop.animate([{ opacity: params.dim }, { opacity: 0 }], {
      duration: ms,
      easing: "ease-out",
      fill: "forwards",
    });
    animsRef.current = [zoom, fade];
    zoom.onfinish = () => {
      busyRef.current = false;
      setOpenIdx(null);
    };
  };

  // Escで閉じる(モーダル系UIの必須作法)。closeは毎render変わるため依存配列なしで貼り直す
  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <DemoStage hint="クリック: 拡大 / 背景・Esc・×: 閉じる">
      <div className={styles.scene}>
        <div className={styles.thumbs}>
          {THUMBS.map((src, i) => (
            <button
              key={src}
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              className={styles.thumb}
              onClick={() => open(i)}
              aria-label={`Open image ${i + 1}`}
            >
              <img src={src} alt="" draggable={false} className={styles.img} />
            </button>
          ))}
        </div>
        {openIdx !== null && (
          <>
            <div
              ref={backdropRef}
              className={styles.backdrop}
              style={{ opacity: params.dim }}
              onClick={close}
              aria-hidden
            />
            <div ref={largeRef} className={styles.large}>
              <img
                src={THUMBS[openIdx]}
                alt=""
                draggable={false}
                className={styles.img}
              />
              <button
                className={styles.close}
                onClick={close}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </>
        )}
      </div>
    </DemoStage>
  );
}
