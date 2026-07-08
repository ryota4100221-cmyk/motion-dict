import type { MotionEntry } from "@/lib/types";

export const marquee: MotionEntry = {
  slug: "marquee",
  category: "text",
  nameJa: "無限マーキー",
  nameEn: "infinite marquee / text loop",
  lede: "テキストが横に流れ続ける無限ループ。ブランド名やキーワードを大きく流してセクションの区切りや世界観づくりに使う。継ぎ目なくループさせる複製と巻き戻しの設計がすべて。",
  params: [
    {
      key: "speed",
      label: "speed(流れる速さ px/秒)",
      min: 20,
      max: 200,
      step: 10,
      default: 80,
      desc: "60〜100が読める速さ。速いほど装飾、遅いほど朗読の空気になる。",
    },
    {
      key: "gap",
      label: "gap(テキスト間の余白 px)",
      min: 16,
      max: 120,
      step: 8,
      default: 48,
      desc: "繰り返し同士の間隔。詰めると帯、空けるとリズムが生まれる。",
    },
    {
      key: "direction",
      label: "direction(流れる向き)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["left", "right"],
      desc: "2段並べて逆向きに流すと定番のすれ違い演出になる。",
    },
  ],
  promptTemplate: `テキストに infinite marquee を実装してください。

- テキスト+余白 {{gap}}px を1セットとし、コンテナ幅+1セット分を覆える回数だけ複製する(white-space: nowrap)
- requestAnimationFrame の毎フレーム、経過時間×速度でtranslateXを進める(毎秒 {{speed}}px、向きは{{direction}})
- 移動量はセット幅で剰余(モジュロ)を取って巻き戻し、継ぎ目が見えないようにする
- 動かすのはtransformのみ。leftやmargin、CSSのanimation-delayによる位置合わせは使わない
- 複製したテキストにはaria-hiddenを付け、スクリーンリーダーには1回だけ読ませる
- prefers-reduced-motion 時はアニメーションを停止し、静止テキストを表示する`,
  ngExample: {
    say: "「文字が横に流れてるやつやって」",
    why: "速さの単位(px/秒か1周何秒か)・向き・ループの継ぎ目処理が未定義。CSS animationで1本のテキストを往復させるだけの、端で途切れる実装が返ってきがち。",
  },
  okExample: {
    say: "「infinite marqueeを実装。テキストを複製してnowrap、rAFで毎秒80px左へ、セット幅の剰余で巻き戻して継ぎ目なし、gap 48px、reduced-motionは静止」",
    why: "速度を「px/秒」で指定し、継ぎ目の処理方法(剰余で巻き戻す)まで言語化している。ここが曖昧だとテキスト長を変えた瞬間に破綻する。",
  },
  vocab: [
    {
      term: "seamless loop",
      desc: "継ぎ目のないループ。1セット分進んだら剰余で0に巻き戻す。複製が足りないと巻き戻しの瞬間に空白が見える。",
    },
    {
      term: "px/秒",
      desc: "マーキーの速度指定は所要時間ではなく速度で。durationで指定するとテキスト長が変わるたびに体感速度が変わってしまう。",
    },
    {
      term: "track",
      desc: "複製したテキストを横一列に並べた可動部。動かすのはこのtrackのtransformだけにするとGPU合成で滑らかになる。",
    },
    {
      term: "aria-hidden",
      desc: "装飾目的の複製テキストを支援技術から隠す属性。付けないと同じ文が10回読み上げられる。",
    },
  ],
  related: ["velocity-skew", "typewriter", "scroll-progress"],
};
