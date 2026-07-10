import type { MotionEntry } from "@/lib/types";

export const dotsPulse: MotionEntry = {
  slug: "dots-pulse",
  category: "loading",
  nameJa: "ドットパルス",
  nameEn: "dots pulse / typing indicator",
  lede: "3つの点が左から順に膨らむ待機表現。チャットの「入力中」で誰もが知る形だが、肝はanimation-delayによる位相ずらしで、これが揃っていないとただの点滅に見える。",
  params: [
    {
      key: "speed",
      label: "speed(1周期の長さ s)",
      min: 0.6,
      max: 2.4,
      step: 0.1,
      default: 1.2,
      desc: "1.0〜1.4sが自然。0.8s未満は急かされている印象になる。",
    },
    {
      key: "stagger",
      label: "stagger(点の間の遅延 s)",
      min: 0.05,
      max: 0.4,
      step: 0.05,
      default: 0.15,
      desc: "0.1〜0.2sで「波が伝わる」ように見える。0.3s以上だとバラバラの点滅に分解する。",
    },
  ],
  promptTemplate: `チャットの「入力中」に使うドットパルス(typing indicator)を実装してください。

- 3つの点を横に並べ、1周期 {{speed}}s の ease-in-out 無限ループで各点を scale と opacity で膨らませる
- 各点の animation-delay を {{stagger}}s ずつずらし、左から順に波が伝わるようにする
- 膨らむのは周期の前半30%程度に収め、残りは静止させてリズムを作る(全区間動かし続けない)
- transform: scale で動かし、width / height はアニメーションさせない(リフロー禁止)
- prefers-reduced-motion 時はアニメーションを止め、3点を同じ不透明度で静的に表示する`,
  ngExample: {
    say: "「点が3つ動くローディングを作って」",
    why: "3点が同時に点滅するだけの実装や、opacityのみで動きの重心がないものが返ってくる。位相ずらし(delay)と「動く区間/止まる区間」の配分を指定しないと波にならない。",
  },
  okExample: {
    say: "「typing indicatorを3点で。1.2s周期のease-in-outループ、各点のanimation-delayを0.15sずつずらす。膨らみはscale(1→1.6)+opacityで周期の前半30%に収める。reduced-motionでは静止」",
    why: "周期・遅延・変化量・動く区間の配分まで数値で指定。「delayをずらす」と明示することで、点滅ではなく波として実装される。",
  },
  vocab: [
    {
      term: "animation-delay",
      desc: "アニメーションの開始をずらす指定。同じkeyframesを使い回して位相だけ変えるのが定石。",
    },
    {
      term: "位相(phase)",
      desc: "周期運動の中の「今どこか」。隣同士の位相を少しずつずらすと波に見える。",
    },
    {
      term: "stagger",
      desc: "複数要素の開始時間を等間隔でずらすこと。GSAP等では専用オプションがあるほど頻出の概念。",
    },
    {
      term: "keyframesの静止区間",
      desc: "60%〜100%を同じ値にするなど、動かない区間を作る技法。ループに「間」が生まれ上品になる。",
    },
  ],
  related: ["spinner-ring", "wave-text", "typewriter"],
};
