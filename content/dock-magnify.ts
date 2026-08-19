import type { MotionEntry } from "@/lib/types";

export const dockMagnify: MotionEntry = {
  slug: "dock-magnify",
  category: "hover",
  nameJa: "ドックマグニファイ",
  nameEn: "dock magnification / fisheye dock",
  lede: "カーソルに一番近いアイコンが最大に膨らみ、隣・その隣となだらかに小さくなっていくmacOSドックの拡大。1つだけ大きくする実装との差は距離の減衰カーブにあり、そこを二次で落とすとあの「山」の形になる。",
  params: [
    {
      key: "maxScale",
      label: "maxScale(直下の最大倍率)",
      min: 1,
      max: 2.4,
      step: 0.05,
      default: 1.6,
      desc: "1.5〜1.8倍が実用。2倍を超えると隣を押しのけて列が暴れて見える。",
    },
    {
      key: "range",
      label: "range(拡大が届く距離 px)",
      min: 40,
      max: 320,
      step: 10,
      default: 160,
      desc: "アイコン3〜4個分(140〜180px)で山がなだらかになる。狭いほど反応が鋭く、機械的になる。",
    },
    {
      key: "lift",
      label: "lift(せり出す量 px)",
      min: 0,
      max: 24,
      step: 1,
      default: 10,
      desc: "拡大に比例して上へ持ち上げる量。0だと純粋な拡大、8〜12pxで「せり出す」感じが出る。",
    },
    {
      key: "duration",
      label: "duration(倍率が追いつく時間 s)",
      min: 0,
      max: 0.5,
      step: 0.02,
      default: 0.12,
      desc: "0.1〜0.15sが滑らか。0.3sを超えるとカーソルに遅れて付いてくる重さが出る。",
    },
  ],
  promptTemplate: `アイコンを横一列に並べたドックに dock magnification を実装してください。

- mousemove でポインタのX座標を取り、各アイテムの中心とのX距離 d を求める
- 倍率は距離の二次関数で落とす: scale = 1 + ({{maxScale}} - 1) * max(0, 1 - (d / {{range}})^2)
  {{range}}px より遠いアイテムは等倍のまま(隣が連れて膨らむ「山」がドックらしさの正体)
- 中心の測定は transform 適用後の矩形ではなく、レイアウト上の位置(offsetLeft)から出す
  拡大後の矩形で測ると中心が自分の拡大に引きずられて震える
- 適用するのは transform: translateY(せり出し) scale() だけ。せり出し量は倍率に比例させ、最大 {{lift}}px
- width / height / margin は絶対に動かさない(列の全アイテムにリフローが波及してカクつく)
- transform-origin: bottom center。底辺を揃えたまま上へ伸ばす
- transition: transform {{duration}}s ease-out。mousemove ごとの値の飛びをここで吸収する
- ドックから mouseleave したら全アイテムを scale(1) に戻す
- タッチ環境には hover が無いので、指のX座標(touchmove)で同じ計算を行うか、拡大を無効にして等倍で並べる。ホバー前提のまま放置しない
- prefers-reduced-motion: reduce では拡大を行わず、いま指しているアイテムを背景色の変化だけで示す`,
  ngExample: {
    say: "「macOSのDockみたいに、ホバーしたらアイコンが大きくなるナビにして」",
    why: "「Dockみたい」だけだと、ホバー中の1個だけがポンと拡大する実装が返ってくる。Dockらしさの正体は隣が連れて膨らむ距離の減衰なので、影響範囲と落とし方を言わないと再現されない。加えて width/height で拡大され、列全体が押し合ってガタつく実装も定番の失敗。",
  },
  okExample: {
    say: "「dock magnificationを実装。ポインタXと各アイコン中心のX距離dで scale = 1 + 0.6 * max(0, 1 - (d/160)^2)、最大1.6倍。中心はoffsetLeftから算出。transform: translateY(最大-10px) scale() のみで、transform-origin: bottom、transition 0.12s ease-out。leaveで等倍に戻す」",
    why: "減衰式・影響範囲・最大倍率・変形プロパティ・戻しまで数値で指定してある。「中心はoffsetLeftから」「transformのみ」の2点が、震えとガタつきという2大失敗を先回りで潰している。",
  },
  vocab: [
    {
      term: "距離減衰(falloff)",
      desc: "カーソルからの距離を倍率へ変換する曲線。二次で落とすとドック特有のなだらかな山になり、線形だと稜線が角張る。",
    },
    {
      term: "フィッシュアイ(fisheye)",
      desc: "注目点だけを拡大して周辺を縮めて見せる情報可視化の手法。ドックの拡大はその応用で、狭い帯に多数の項目を置くための道具。",
    },
    {
      term: "transform-origin: bottom",
      desc: "拡大の基準点を下端に置く指定。底辺が揃ったまま上だけ伸びるので「せり出す」印象になる。",
    },
    {
      term: "リフロー(reflow)",
      desc: "width/heightを動かすと走るレイアウト再計算。横一列では全アイテムに波及するため、拡大は必ずtransformで行う。",
    },
    {
      term: "hover: none",
      desc: "ポインタでのホバーができない環境を判定するメディア特性。タッチではホバー前提の演出を切るか、指の座標で代替する。",
    },
  ],
  related: ["magnetic-hover", "focus-dim", "hover-wave"],
};
