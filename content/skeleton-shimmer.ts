import type { MotionEntry } from "@/lib/types";

export const skeletonShimmer: MotionEntry = {
  slug: "skeleton-shimmer",
  category: "loading",
  nameJa: "スケルトンシマー",
  nameEn: "skeleton screen / shimmer",
  lede: "実コンテンツと同じ形の骨組みの上を光の帯がループで走り、「読み込み中で、もうすぐ出る」を伝える定番。スピナーと違いレイアウトを先に約束するため、体感待ち時間と読み込み後のガタつきを同時に減らせる。",
  params: [
    {
      key: "speed",
      label: "speed(シマーの周期 s)",
      min: 0.6,
      max: 3,
      step: 0.1,
      default: 1.4,
      desc: "光が1回走る周期。1.2〜1.6sが目安。速いと焦らせ、2s超は止まって見える瞬間ができる。",
    },
    {
      key: "width",
      label: "width(光の幅 %)",
      min: 10,
      max: 60,
      step: 5,
      default: 30,
      desc: "ブロック幅に対するハイライトの割合。20〜35%が上品。広すぎると点滅に見える。",
    },
  ],
  promptTemplate: `読み込み中のプレースホルダに skeleton shimmer を実装してください。

- 実コンテンツと同じレイアウト・同じ寸法の骨組み(角丸矩形と円)を薄いグレーで置く
- 各ブロックに 105deg の linear-gradient(透明→ハイライト→透明)を background-size: 200% 100% で敷き、光の帯の幅はブロック幅の {{width}}% にする
- background-position をCSSキーフレームで動かし、{{speed}}s 周期・linear・無限ループで左から右へ光を通す(JS不要)
- 骨組みの寸法は実コンテンツと一致させ、差し替え時のレイアウトシフトをゼロにする
- 読み込みが終わったら周期の完了を待たず即座に実コンテンツへ差し替える
- prefers-reduced-motion 時はシマーを止め、静止したスケルトンのみ表示する`,
  ngExample: {
    say: "「ローディング中はそれっぽいプレースホルダを出しといて」",
    why: "形も動きも未定義。実コンテンツと寸法の違う灰色の箱が並び、読み込み完了時に画面全体がガタッとずれる。光が走らない静止した箱は「壊れて止まっている」ようにも見える。",
  },
  okExample: {
    say: "「skeleton shimmerを実装。実UIと同寸の骨組みに105degのグラデーションをbackground-size 200%で敷き、background-positionのキーフレームで1.4s linear無限ループ、光の幅は30%、reduced-motion時は静止」",
    why: "寸法一致・グラデーションの角度・周期・CSSのみで完結する実装方式まで指定している。「実UIと同寸」の一言がレイアウトシフトを防ぐ。",
  },
  vocab: [
    {
      term: "スケルトンスクリーン",
      desc: "実コンテンツの骨組みを先に見せる読み込みUI。何がどこに出るかを予告するため、スピナーより体感待ち時間が短い。",
    },
    {
      term: "シマー(shimmer)",
      desc: "骨組みの上を走る光の帯。「処理が進行中」を伝えるのはこの動きで、これが無い静止スケルトンは故障と区別がつかない。",
    },
    {
      term: "レイアウトシフト(CLS)",
      desc: "読み込み後にレイアウトがずれる量。骨組みを実寸で作れば差し替え時のずれをゼロにできる。",
    },
    {
      term: "background-position",
      desc: "敷いたグラデーションをずらして光を動かす手軽な方式。要素数が多い画面では::after+translateXの方が描画負荷が軽い。",
    },
  ],
  related: ["loading-bar", "preloader-counter", "blur-reveal"],
};
