import type { MotionEntry } from "@/lib/types";

export const kenBurns: MotionEntry = {
  slug: "ken-burns",
  category: "media",
  nameJa: "ケンバーンズ",
  nameEn: "ken burns effect / slow zoom pan",
  lede: "静止画がゆっくりズームしながらパンし続け、1枚の写真に映像のような時間を持たせる演出。ヒーロー背景やギャラリーの定番で、「動いていると気づかれない速度」を保てるかが品質の分かれ目。",
  params: [
    {
      key: "zoom",
      label: "zoom(最大倍率)",
      min: 1.05,
      max: 1.3,
      step: 0.01,
      default: 1.15,
      desc: "1.1〜1.2が映像らしい。1.3に近づくと画像が粗く見え、背景なのに圧が出る。",
    },
    {
      key: "pan",
      label: "pan(移動距離 %)",
      min: 0,
      max: 6,
      step: 0.5,
      default: 3,
      desc: "2〜4%で十分。画像を枠より一回り大きく敷き、ブリードの範囲内に収める。",
    },
    {
      key: "duration",
      label: "duration(片道の時間 s)",
      min: 6,
      max: 20,
      step: 1,
      default: 12,
      desc: "8〜15sが定番。6sを切ると動きが目につき、背景ではなく主張になってしまう。",
    },
  ],
  promptTemplate: `ヒーローの静止画に ken burns effect を実装してください。

- 画像を包む枠に overflow: clip を指定してはみ出しを切り落とす(枠のサイズは固定)
- 画像は枠より一回り大きく配置し(inset: -7% 程度)、パンで端が露出しないブリードを確保する
- 中の画像だけを @keyframes で scale(1) translate(0, 0) から scale({{zoom}}) translate({{pan}}%, {{pan}}%) まで、{{duration}}s の ease-in-out で動かす
- animation-direction: alternate + infinite で往復させ、ループの継ぎ目にジャンプを作らない
- 動かすのは transform のみ(width / height / background-position は使わない)。画像に will-change: transform を付ける
- prefers-reduced-motion 時は animation: none にして静止画のまま表示する`,
  ngExample: {
    say: "「トップの写真をずっとゆっくり動かして、映画みたいにして」",
    why: "「ゆっくり」では倍率も周期も決まらない。background-positionを動かすカクつく実装や、ループ終端でscale(1)に一瞬で戻る「ジャンプ」付きの実装が返ってきやすい。",
  },
  okExample: {
    say: "「ken burns effectを実装。overflow:clipの枠内で画像を@keyframesでscale(1→1.15)+translate 3%、片道12s ease-in-out、alternate infinite。transformのみ、reduced-motionでは静止」",
    why: "倍率・移動量・周期・ループ方式・パフォーマンス制約が一文に揃っている。「alternate」の一語で継ぎ目のジャンプ問題を先回りできる。",
  },
  vocab: [
    {
      term: "ken burns",
      desc: "ドキュメンタリー映画監督Ken Burnsに由来する呼び名。静止画にズームとパンを与えて映像として見せる手法。",
    },
    {
      term: "overflow: clip",
      desc: "hiddenと同じくはみ出しを切るが、スクロール可能領域を作らないぶん軽い。祖先に使ってもposition: stickyを殺さない。",
    },
    {
      term: "animation-direction: alternate",
      desc: "往復再生。終点まで行ったら逆再生で戻るため、無限ループでも継ぎ目のジャンプが出ない。",
    },
    {
      term: "ブリード",
      desc: "パンで動かす分だけ画像を枠より大きく敷いておく余白。これがないと移動中に画像の端が露出する。",
    },
  ],
  related: ["image-zoom-hover", "duotone-hover", "parallax"],
};
