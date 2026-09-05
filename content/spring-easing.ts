import type { MotionEntry } from "@/lib/types";

export const springEasing: MotionEntry = {
  slug: "spring-easing",
  category: "ui",
  nameJa: "スプリングイージング",
  nameEn: "spring easing / linear() easing function / physics-based easing",
  lede: "行き過ぎてから戻って落ち着く、ばねの物理から作ったイージング。CSSのlinear()に刻んで渡せばJSなしで使え、cubic-bezierでは表現できない「1を超える」動きが手に入る。",
  params: [
    {
      key: "stiffness",
      label: "stiffness(ばねの硬さ)",
      min: 40,
      max: 400,
      step: 10,
      default: 180,
      desc: "目標へ引き戻す力。大きいほど速く動き、振動も速くなる。UIの通常操作は150〜220、キビキビ見せたいトグルやチップは260以上が目安。",
    },
    {
      key: "damping",
      label: "damping(減衰)",
      min: 4,
      max: 40,
      step: 1,
      default: 12,
      desc: "揺れを止める抵抗。小さいほど何度も往復する。10〜16で「1回だけ気持ちよく行き過ぎる」。26を超えると行き過ぎが消えてease-outとほぼ同じになる。",
    },
    {
      key: "duration",
      label: "duration(尺 s)",
      min: 0.3,
      max: 1.6,
      step: 0.05,
      default: 0.85,
      desc: "linear()に焼き込む再生時間。ばねが落ち着くより短いと途中で切られて動きが硬くなる。0.6〜0.9sが実用域。",
    },
  ],
  promptTemplate: `要素の移動に spring easing(ばねイージング)を実装してください。

- 質量1・stiffness {{stiffness}}・damping {{damping}} の減衰振動を時間で解き、
  0→1に正規化した変位を {{duration}}s ぶん等間隔にサンプリングする
- サンプル列を CSS の linear() イージング(例: linear(0, 0.57, 1.14, 0.98, 1))として書き出し、
  transition-timing-function に渡す。cubic-bezier は1を超えられないので使わない
- 動かすのは transform / translate だけ。top・left・width はアニメーションさせない
- 行き過ぎ(オーバーシュート)が1回だけ見える減衰にする。何度も往復させない
- prefers-reduced-motion: reduce では linear() を使わず、
  transition を切って位置だけ即座に確定させる(行き過ぎは目の負担になるため必ず外す)`,
  ngExample: {
    say: "「ボタンの動きをバネっぽく、ぽよんとさせて」",
    why: "「ぽよん」は硬さと減衰の2つの数字に分かれていないので決まらない。多くの場合cubic-bezier(0.34, 1.56, 0.64, 1)を貼られて終わり、行き過ぎ量も揺れの回数も指定できないまま固定される。",
  },
  okExample: {
    say: "「stiffness 180 / damping 12 のばねを0.85s分サンプリングしてlinear()イージングを生成し、translateのtransition-timing-functionに渡して。オーバーシュートは1回。reduced-motion時はtransitionごと切る」",
    why: "物理パラメータ・尺・出力形式(linear())・オーバーシュート回数まで数値で決まる。実装がcubic-bezierに逃げられなくなり、後から硬さだけを触って調整できる。",
  },
  vocab: [
    {
      term: "linear()",
      desc: "折れ線でイージングを定義するCSS関数。値が1を超える点も書けるので、行き過ぎを含む曲線をJSなしで表現できる。",
    },
    {
      term: "減衰比(damping ratio)",
      desc: "damping ÷ 2√stiffness。1未満なら行き過ぎて振動し、1でちょうど行き過ぎずに止まる。UIでは0.4〜0.7あたりが心地よい。",
    },
    {
      term: "オーバーシュート",
      desc: "目標値を一度追い越すこと。追い越し量が「勢い」の正体で、1.1〜1.2倍あたりが上品な範囲。",
    },
    {
      term: "cubic-bezier の限界",
      desc: "制御点は縦方向に1を超えて置けるが、振動は1往復ぶんしか作れない。2回以上の揺れや細かい減衰はlinear()でしか書けない。",
    },
  ],
  related: ["bounce-in", "rubber-band", "magnetic-hover"],
};
