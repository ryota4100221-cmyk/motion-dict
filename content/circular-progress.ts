import type { MotionEntry } from "@/lib/types";

export const circularProgress: MotionEntry = {
  slug: "circular-progress",
  category: "loading",
  nameJa: "サークルプログレス",
  nameEn: "circular progress / ring progress",
  lede: "進捗率に応じて円周が描かれていくリング。stroke-dasharrayに円周長を入れ、stroke-dashoffsetを進捗で減らすSVGの定番テクニックで、スキル表示やアップロード進捗まで使い回せる。",
  params: [
    {
      key: "duration",
      label: "duration(描画時間 s)",
      min: 0.4,
      max: 3,
      step: 0.1,
      default: 1.5,
      desc: "1〜2sが見せ場として丁度いい。0.5s未満だと描かれる過程が伝わらない。",
    },
    {
      key: "progress",
      label: "progress(進捗率 %)",
      min: 5,
      max: 100,
      step: 5,
      default: 72,
      desc: "デモ用の到達値。実装ではデータから算出した値を渡す。",
    },
  ],
  promptTemplate: `進捗率に応じて円周が描かれるサークルプログレスを実装してください。

- SVGの circle を2つ重ね、背面は薄い色のトラック(完全な円)、前面が進捗の弧
- 前面の circle に stroke-dasharray: 円周長(2πr) を設定し、stroke-dashoffset = 円周長 × (1 - 進捗率) で {{progress}}% まで描く
- 開始位置が12時になるよう -90deg 回転させておく
- 表示時に stroke-dashoffset を {{duration}}s の ease-out で transition させ、0%から目標値まで描く
- stroke-linecap: round で先端を丸め、中央に進捗率の数値を置く
- レイアウトに影響するプロパティは動かさない(stroke-dashoffsetのみアニメーション)
- prefers-reduced-motion 時はアニメーションせず、最終の進捗率を即時表示する`,
  ngExample: {
    say: "「進捗を丸いゲージで見せて」",
    why: "conic-gradientの角がガタつく実装や、開始位置が3時のまま・先端が角ばったままの弧が返ってくる。dashoffset方式と開始位置・先端処理を指定しないと細部で崩れる。",
  },
  okExample: {
    say: "「circular progressをSVG 2重circle + stroke-dashoffsetで。円周長をdasharrayに設定、-90degで12時始まり、1.5s ease-outで0→72%を描画。linecap round、中央に数値。reduced-motionでは即時表示」",
    why: "dashoffsetの計算式・開始位置・時間・先端処理まで指定。「12時始まり」の一言がないと弧は3時から描かれ、途端に素人っぽくなる。",
  },
  vocab: [
    {
      term: "circumference(円周長)",
      desc: "2πr。dasharrayとdashoffsetの計算の基準になる値で、これを間違えると弧が一周しない。",
    },
    {
      term: "stroke-dashoffset",
      desc: "破線の開始位置をずらす指定。円周長から進捗分を引いた値にすると「描かれた長さ」を制御できる。",
    },
    {
      term: "確定(determinate)",
      desc: "完了までの割合が分かるローディング表現。割合が取れないならリングスピナー等の不確定表現を使う。",
    },
    {
      term: "pathLength",
      desc: "SVG要素の路長を任意の値(例:100)に正規化する属性。使うとdashoffsetを進捗%そのままで書ける。",
    },
  ],
  related: ["spinner-ring", "scroll-progress", "counter"],
};
