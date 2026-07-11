import type { MotionEntry } from "@/lib/types";

export const liquidFill: MotionEntry = {
  slug: "liquid-fill",
  category: "loading",
  nameJa: "リキッドフィル",
  nameEn: "liquid fill loader / wave loading",
  lede: "容器やロゴの中を液体が満ちていくローディング。横に長い波形パスをtranslateXで無限ループさせ、clipPathで容器の形に閉じ込めるのが定番の作り。水位を進捗率に連動させれば確定型のプログレスにもなる。",
  params: [
    {
      key: "progress",
      label: "progress(水位 %)",
      min: 5,
      max: 100,
      step: 5,
      default: 65,
      desc: "デモ用の到達水位。実装では読み込み進捗から算出した値を渡す。",
    },
    {
      key: "duration",
      label: "duration(満ちる時間 s)",
      min: 0.5,
      max: 3,
      step: 0.1,
      default: 1.5,
      desc: "水位が0%から目標まで上がる時間。1〜2sが目安。進捗連動なら値の更新ごとに0.3〜0.5sで追従させる。",
    },
    {
      key: "amplitude",
      label: "amplitude(波の高さ px)",
      min: 2,
      max: 12,
      step: 1,
      default: 6,
      desc: "波の振幅。4〜8pxが液体らしい。大きすぎると水面が暴れて水位=進捗が読めなくなる。",
    },
    {
      key: "speed",
      label: "speed(波の周期 s)",
      min: 1,
      max: 5,
      step: 0.5,
      default: 2.5,
      desc: "波が1回流れる時間。2〜3sがゆったり自然。1s未満は沸騰して見え、落ち着きがなくなる。",
    },
  ],
  promptTemplate: `容器の中を液体が満ちていく liquid fill loader をSVGで実装してください。

- 容器(円)の形の clipPath を定義し、液体はすべてその中に閉じ込める
- 液体は上辺をなだらかなサインカーブ状にした波形パスで作る。パスの横幅は容器の2倍以上とり、CSSキーフレームの translateX で波長の整数倍ぶん左へ動かして {{speed}}s・linear・無限ループさせる(パスの周期と移動量を一致させ、ループの繋ぎ目を消す)
- 波の振幅は {{amplitude}}px。波を2枚重ね、背面は透明度低め・周期長めにすると奥行きが出る
- 水位(water level)は波パスを包む親グループの translateY で表現し、進捗率から線形に変換する(容器の底=0%、上端=100%)
- 水位は 0% から {{progress}}% まで {{duration}}s の ease-out で transition させる
- 波のループ(translateX)と水位(translateY)は別のグループに分け、transformを衝突させない
- 中央に進捗率の数値を重ねる
- prefers-reduced-motion 時は波のループを止め、水位はアニメーションなしで最終値を即時表示する`,
  ngExample: {
    say: "「ロゴに水が溜まっていくようなローディングにして」",
    why: "波の作り方が未指定だと、角丸のborder-radiusを回転させる古いハック(角が目立って水に見えない)や、波のない只の矩形がせり上がるだけの実装が返ってくる。ループの繋ぎ目で波がワープするのも定番の失敗。",
  },
  okExample: {
    say: "「liquid fill loaderをSVGで。円のclipPathに横幅2倍の波形パスを入れ、translateXを2.5s linearで無限ループ(周期と移動量を一致させ繋ぎ目なし)。振幅6px、水位は親グループのtranslateYで0→65%を1.5s ease-out。中央に%表示、reduced-motionでは波停止+即時表示」",
    why: "clipPath方式・波のループの繋ぎ方・振幅・水位の動かし方まで指定している。「周期と移動量を一致させる」の一言で繋ぎ目のワープが消え、translateXとtranslateYの分離で水位と波が独立に動く。",
  },
  vocab: [
    {
      term: "clipPath",
      desc: "SVGの切り抜き定義。液体を容器やロゴの形に閉じ込める要。テキストや複雑なパスもそのまま容器にできる。",
    },
    {
      term: "シームレスループ",
      desc: "パスの繰り返し周期と移動距離を一致させ、ループの境目を見えなくする設計。波・マーキー・無限スクロールに共通する考え方。",
    },
    {
      term: "振幅(amplitude)",
      desc: "波の山と谷の高さ。液体の粘度の印象を決める。小さいほど水、大きいほどスライムに近づく。",
    },
    {
      term: "水位(water level)",
      desc: "進捗率をtranslateYに変換した値。容器の底=0%、上端=100%になるよう線形にマッピングする。",
    },
  ],
  related: ["circular-progress", "preloader-counter", "blob-morph"],
};
