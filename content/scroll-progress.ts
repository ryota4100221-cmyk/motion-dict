import type { MotionEntry } from "@/lib/types";

export const scrollProgress: MotionEntry = {
  slug: "scroll-progress",
  category: "scroll",
  nameJa: "読了プログレスバー",
  nameEn: "scroll progress bar",
  lede: "ページをどこまで読んだかを、画面上端のバーの伸びで示す動き。記事やLPの読了率を可視化する定番UIで、widthではなくtransform: scaleXで描くのが正攻法。",
  params: [
    {
      key: "height",
      label: "height(バーの太さ px)",
      min: 1,
      max: 8,
      step: 1,
      default: 2,
      desc: "2〜3pxが主流。太いほどUI感が強くなり、コンテンツと競合し始める。",
    },
    {
      key: "smoothing",
      label: "smoothing(追従のなめらかさ)",
      min: 0.05,
      max: 1,
      step: 0.05,
      default: 0.15,
      desc: "1で即時追従。0.15前後にするとバーの先端がすっと滑る質感になる。",
    },
  ],
  promptTemplate: `ページ上部に scroll progress bar を実装してください。

- 進捗 = scrollY ÷ (ドキュメント全高 − ビューポート高)で0〜1を算出する
- バーは position: fixed、高さ {{height}}px、transform-origin: left で transform: scaleX(進捗) で伸ばす
- 反映は requestAnimationFrame + lerp(係数 {{smoothing}})でなめらかに追従させる(1なら即時)
- width の書き換えは使わず、scaleX でリフローを避ける
- prefers-reduced-motion 時は lerp をやめて即時反映にする`,
  ngExample: {
    say: "「今どこ読んでるかわかるバーを上につけて」",
    why: "scrollイベントでwidthを直接書き換える、毎フレームリフローが走る実装が返ってきがち。太さ・色・追従の質感・固定位置の指定もなく、見た目も動きも運任せになる。",
  },
  okExample: {
    say: "「scroll progress barを実装。scaleXで伸ばしtransform-origin: left、高さ2px、rAF+lerp 0.15で追従、widthの書き換えは禁止」",
    why: "描画方式(scaleX)・基準点・太さ・補間係数まで指定している。「widthは使わない」と明言するとパフォーマンスの悪い実装を確実に避けられる。",
  },
  vocab: [
    {
      term: "scaleX",
      desc: "横方向の拡大縮小。widthの書き換えと違いリフローが起きず、GPUだけで60fpsで動かせる。",
    },
    {
      term: "transform-origin",
      desc: "変形の基準点。leftにすると左端を固定して右へ伸びる。指定を忘れると中央から両側に伸びる。",
    },
    {
      term: "進捗率",
      desc: "scrollY ÷ (ページ全高 − ビューポート高)。0〜1に正規化した値をそのままscaleXに渡す。",
    },
    {
      term: "リフロー",
      desc: "レイアウトの再計算。widthを毎フレーム書き換えると発生し、スクロールがカクつく主因になる。",
    },
  ],
  related: ["scroll-fade-in", "counter"],
};
