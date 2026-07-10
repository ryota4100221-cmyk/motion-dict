import type { MotionEntry } from "@/lib/types";

export const spinnerRing: MotionEntry = {
  slug: "spinner-ring",
  category: "loading",
  nameJa: "リングスピナー",
  nameEn: "ring spinner / loading spinner",
  lede: "円弧が回転し続ける不確定ローディングの最小形。borderを回すだけの安易な実装と、SVGのstroke-dasharrayで弧を伸縮させる実装とでは、同じ「くるくる」でも質感がまるで違う。",
  params: [
    {
      key: "speed",
      label: "speed(1回転の時間 s)",
      min: 0.5,
      max: 3,
      step: 0.1,
      default: 1.2,
      desc: "1〜1.5sが標準。0.8sを切るとせわしなく、2sを超えると処理が止まって見える。",
    },
    {
      key: "thickness",
      label: "thickness(線の太さ px)",
      min: 1,
      max: 8,
      step: 1,
      default: 3,
      desc: "3〜4pxが標準。リング直径の1/10を超えると急に野暮ったくなる。",
    },
  ],
  promptTemplate: `不確定ローディング用のリングスピナーを実装してください。

- borderを回すのではなく、SVGの circle に stroke-dasharray を設定して弧を描く
- 全体を {{speed}}s/周 の linear で回転させ続ける
- 同時に stroke-dasharray / stroke-dashoffset を ease-in-out でループさせ、弧が伸び縮みするようにする(Material Design系の質感)
- 線の太さは stroke-width {{thickness}}px、stroke-linecap: round で先端を丸める
- 背面に薄い色のトラック(完全な円)を敷き、リングの居場所を常に示す
- transform と stroke-* のみで動かし、レイアウトを変化させない
- prefers-reduced-motion 時は回転と伸縮を止め、静的な3/4の弧を表示する`,
  ngExample: {
    say: "「くるくる回るローディングを付けて」",
    why: "border 3辺に色を付けてrotateさせるだけの、弧が固定長の既製品っぽいスピナーが返ってくる。速度も太さも先端の形も未指定なので、サイトのトーンと無関係な出来になる。",
  },
  okExample: {
    say: "「ring spinnerをSVG circle + stroke-dasharrayで実装。1.2s/周のlinear回転に弧の伸縮ループを重ね、stroke-width 3px・linecap round。背面に薄いトラック。reduced-motionでは静的な弧」",
    why: "実装方式(SVG+dasharray)と回転速度・太さ・先端処理まで指定。「弧の伸縮を重ねる」の一言が、borderスピナーとの品質差を生む。",
  },
  vocab: [
    {
      term: "stroke-dasharray",
      desc: "SVGの線を「実線の長さ, 空白の長さ」で区切る指定。円に使うと任意の長さの弧が描ける。",
    },
    {
      term: "stroke-dashoffset",
      desc: "破線パターンの開始位置をずらす指定。dasharrayと組み合わせて弧を円周上で動かす。",
    },
    {
      term: "不確定(indeterminate)",
      desc: "完了までの割合が不明なローディング表現。進捗率が取れるならサークルプログレス等の確定表現を優先する。",
    },
    {
      term: "stroke-linecap",
      desc: "線の端の形。roundにすると弧の先端が丸くなり、それだけで柔らかい印象になる。",
    },
  ],
  related: ["dots-pulse", "circular-progress"],
};
