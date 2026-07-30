import type { MotionEntry } from "@/lib/types";

export const ambientFloat: MotionEntry = {
  slug: "ambient-float",
  category: "ui",
  nameJa: "アンビエントフロート",
  nameEn: "ambient float / floating animation / idle drift",
  lede: "画像や図形が、ごくゆっくり上下に漂い続ける常時ループ。止まった画面に「生きている気配」だけを足す背景の動きで、要素ごとに周期をずらして揃わせないことが品質のすべて。",
  params: [
    {
      key: "distance",
      label: "distance(漂う幅 px)",
      min: 4,
      max: 60,
      step: 2,
      default: 18,
      desc: "上下の振れ幅。12〜24pxが「気配」の範囲。40pxを超えると背景ではなく主役になり、読ませたい本文から視線を奪う。",
    },
    {
      key: "duration",
      label: "duration(1往復の時間 s)",
      min: 2,
      max: 14,
      step: 0.5,
      default: 6,
      desc: "基準の周期。5〜8sが呼吸に近く自然。3s以下だと「浮遊」ではなく「振動」に見える。",
    },
    {
      key: "spread",
      label: "spread(周期のばらつき %)",
      min: 0,
      max: 60,
      step: 5,
      default: 35,
      desc: "要素ごとに周期を何%ずらすか。0にすると全部が同時に上下して機械的になる。30〜40%で有機的に散る。",
    },
    {
      key: "rotate",
      label: "rotate(傾きの揺れ deg)",
      min: 0,
      max: 8,
      step: 0.5,
      default: 2,
      desc: "上下動に添える回転。1〜3度で十分。テキストや写真に付けるときは0〜1度に抑えないと酔う。",
    },
  ],
  promptTemplate: `装飾要素に ambient float(常時ループする浮遊アニメーション)を実装してください。

- 各要素を transform: translateY で上下 {{distance}}px の範囲で往復させる
- 基準の周期は {{duration}}s、animation-direction: alternate + ease-in-out で折り返す
- 要素ごとに周期を ±{{spread}}% ずらし、全体が同時に動かないようにする
- 同時に rotate を ±{{rotate}}deg 添えて、単純な上下動に見せない
- 開始位相もずらす。animation-delay に負の値を入れ、初回表示の時点で各要素が周期の途中にいる状態にする
- top/margin ではなく transform のみで動かす(リフローさせない)。will-change: transform を付ける
- prefers-reduced-motion 時はアニメーションを止め、要素は静止位置に置く`,
  ngExample: {
    say: "「画像をふわふわ浮かせて」",
    why: "「ふわふわ」では振れ幅も周期も決まらない。全要素が同じ duration・同じ delay で animation され、6枚が完全に同期して上下する“エレベーター”になって返ってくることが多い。",
  },
  okExample: {
    say: "「ambient floatを実装。translateYで±18px、周期6sをalternate + ease-in-outで往復。要素ごとに周期を±35%・開始位相を負のanimation-delayでずらす。rotateは±2度。transformのみ、reduced-motionでは静止」",
    why: "振れ幅・周期・ばらつき・位相までを数値で指定している。特に「周期と位相をずらす」の一言が、機械的な同期を防いで有機的な浮遊にする決定打になる。",
  },
  vocab: [
    {
      term: "ambient animation",
      desc: "操作に反応せず常時流れ続ける背景の動き。主役ではなく「画面が生きている」ことだけを伝える役割。",
    },
    {
      term: "負のanimation-delay",
      desc: "delayにマイナス値を入れると、その分だけ再生済みの状態から始まる。全要素の開始位相をずらすのに使う定番の手。",
    },
    {
      term: "animation-direction: alternate",
      desc: "1周ごとに再生方向を反転させる指定。keyframesに戻りを書かずに往復でき、折り返しが自然になる。",
    },
    {
      term: "デシンク(desync)",
      desc: "複数要素の周期をあえて非整数比にずらすこと。揃うと機械的、ずらすと有機的に見える。",
    },
    {
      term: "prefers-reduced-motion",
      desc: "動きを減らす端末設定。止まらないループは酔いの原因になりやすく、常時アニメーションでは対応が特に重要。",
    },
  ],
  related: ["hint-nudge", "blob-morph", "rotating-badge"],
};
