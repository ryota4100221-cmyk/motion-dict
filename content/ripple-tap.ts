import type { MotionEntry } from "@/lib/types";

export const rippleTap: MotionEntry = {
  slug: "ripple-tap",
  category: "ui",
  nameJa: "リップル",
  nameEn: "ripple effect / material ripple",
  lede: "タップした地点から波紋が広がるフィードバック。Material Design由来の定番で、「押した場所」を視覚で返すのが本質。円のscale(0→1)とopacityフェードだけで実装でき、リフローが起きない。",
  params: [
    {
      key: "duration",
      label: "duration(広がる時間 s)",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.6,
      desc: "波紋が広がり切るまでの時間。0.5〜0.7sが自然。0.3s未満はフィードバックとして知覚しづらい。",
    },
    {
      key: "size",
      label: "size(波紋の最大直径 px)",
      min: 80,
      max: 400,
      step: 10,
      default: 220,
      desc: "広がり切ったときの直径。要素の対角線を覆う大きさが基本。小さすぎると「点滅」に見える。",
    },
  ],
  promptTemplate: `タップ地点から波紋が広がる ripple effect を実装してください。

- クリック/タップ座標を getBoundingClientRect() で要素内の相対座標にし、その点を中心に円を配置する
- 円は直径 {{size}}px で固定サイズに作り、transform: scale(0) から scale(1) へ {{duration}}s の ease-out で広げる
- 同時に opacity を 0.35 程度から 0 へフェードさせ、アニメーション終了後にDOMから削除する
- widthやheightをアニメーションさせず、transform と opacity のみで動かす(リフロー禁止)
- 要素側は overflow: hidden で波紋を角丸内にクリップする
- 連打されたら波紋を複数同時に重ねて出す(前の波紋を消さない)
- prefers-reduced-motion 時は波紋を出さず、背景色の短いopacityフェードなど動きのないフィードバックに置き換える`,
  ngExample: {
    say: "「押したら波紋が出るようにして」",
    why: "widthとheightをアニメーションさせるリフロー実装や、タップ位置を無視して要素中央からしか広がらない実装が返ってきがち。連打時に前の波紋が消える手抜きも多い。",
  },
  okExample: {
    say: "「rippleをタップ座標中心・直径220pxの円で。scale(0→1)を0.6s ease-out、opacityは0.35→0、終了後にremove。親はoverflow:hiddenでクリップ、連打は重ねて出す」",
    why: "座標の取り方・変形方式・後始末・多重タップの扱いまで指定。「scaleとopacityのみ」の一言でパフォーマンスが担保される。",
  },
  vocab: [
    {
      term: "ripple",
      desc: "タップ地点から広がる波紋。Material Designが広めた呼び名で、そのまま英語圏に通じる。",
    },
    {
      term: "座標の相対化",
      desc: "clientX/Y から getBoundingClientRect() の left/top を引いて要素内座標に直すこと。波紋の中心決めに必須。",
    },
    {
      term: "overflow: hidden",
      desc: "波紋を要素の角丸内に収めるクリップ。忘れると波紋が要素の外へはみ出す。",
    },
    {
      term: "後始末(cleanup)",
      desc: "終わった波紋要素をDOMから削除すること。animationendを拾って消すのが定石。放置するとDOMが溜まり続ける。",
    },
  ],
  related: ["toggle-switch", "circle-reveal"],
};
