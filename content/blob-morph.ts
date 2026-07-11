import type { MotionEntry } from "@/lib/types";

export const blobMorph: MotionEntry = {
  slug: "blob-morph",
  category: "media",
  nameJa: "ブロブモーフ",
  nameEn: "blob morph / organic blob",
  lede: "有機的な塊がゆっくり形を変え続ける背景装飾。SVGフィルタを使わなくても、border-radiusの8値をアニメーションさせるだけで柔らかい塊は作れる。主役ではなく気配──動きすぎる塊は読み物の敵になり、閲覧者を酔わせる。",
  params: [
    {
      key: "duration",
      label: "duration(変形の周期 s)",
      min: 3,
      max: 20,
      step: 1,
      default: 9,
      desc: "8〜12sが呼吸のテンポ。3〜4sは生き物のようにうごめき、視線を奪って酔いの原因になる。",
    },
    {
      key: "amp",
      label: "amp(崩れの振れ幅 %)",
      min: 2,
      max: 22,
      step: 1,
      default: 12,
      desc: "真円(50%)からのずれ幅。8〜15%が有機的。20%を超えると潰れたアメーバになり品が消える。",
    },
    {
      key: "spin",
      label: "spin(回転1周の時間 s)",
      min: 8,
      max: 60,
      step: 2,
      default: 32,
      desc: "遅い回転を重ねると往復変形の単調さが消える。20sを切ると回転自体が目についてくる。",
    },
  ],
  promptTemplate: `背景装飾として有機的な塊がゆっくり形を変え続ける blob morph を実装してください。

- SVGフィルタやパスモーフは使わず、div の border-radius 8値ショートハンド(横4値 / 縦4値)を @keyframes で変化させる軽量実装にする
- 8値は「50% ± {{amp}}%」の範囲で崩す。keyframes を3〜4段作り、各段で8値の組み合わせを変える
- 変形は {{duration}}s の ease-in-out、alternate + infinite で往復させ、ループの継ぎ目に形のジャンプを作らない
- 併せて transform: rotate を {{spin}}s の linear infinite で1回転させる(回転は親要素に分け、transform同士を衝突させない)
- あくまで背景装飾なので本文より低い重なりに置き、pointer-events: none を指定する
- アニメーションさせるのは border-radius と transform のみ。box-shadow や filter を動かすのは重いので禁止
- prefers-reduced-motion 時は animation: none にして静止した形で表示する`,
  ngExample: {
    say: "「うにょうにょ動く丸い背景を置いて」",
    why: "feTurbulence+displacementのSVGフィルタやcanvasを使った重い実装が返ってくることがある。周期と振れ幅の指定がないと3s周期で激しくうごめく塊になり、背景のはずが本文から視線を奪って閲覧者を酔わせる。",
  },
  okExample: {
    say: "「blob morphをborder-radius 8値の@keyframesで実装。50%±12%で3段、9s ease-in-out alternate infinite、親要素を32s linearで回転。pointer-events: none、reduced-motionは静止」",
    why: "実装方式(8値のkeyframes)・振れ幅・周期・回転の分離まで数値で指定している。「±12%」「9s」の2つの数値が、装飾と酔いの境界線を守る。",
  },
  vocab: [
    {
      term: "border-radius 8値",
      desc: "「横の半径4つ / 縦の半径4つ」をスラッシュ区切りで指定する記法。4隅の縦横が非対称になり、円が有機的な塊に崩れる。",
    },
    {
      term: "blob",
      desc: "不定形の有機的な塊を指すデザイン用語。ヒーロー背景やアバター枠の装飾として定番化した。",
    },
    {
      term: "alternate",
      desc: "往復再生。keyframesの終端から逆再生で戻るため、無限ループでも継ぎ目で形がジャンプしない。",
    },
    {
      term: "motion sickness",
      desc: "画面の大きな領域が動き続けると起こる映像酔い。周期を長く・振れ幅を小さく・reduced-motion対応、の3点で防ぐ。",
    },
  ],
  related: ["liquid-fill", "grain-overlay", "gradient-shine"],
};
