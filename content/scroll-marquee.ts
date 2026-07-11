import type { MotionEntry } from "@/lib/types";

export const scrollMarquee: MotionEntry = {
  slug: "scroll-marquee",
  category: "scroll",
  nameJa: "スクロール連動マーキー",
  nameEn: "scroll-driven marquee / scroll velocity marquee",
  lede: "一定速度で流れるマーキーに、スクロールの速度と方向を加算する動き。速くスクロールするほど加速し、逆スクロールで逆流する。等速のmarqueeに慣性が宿り、ページ全体の疾走感につながる。",
  params: [
    {
      key: "speed",
      label: "speed(基本速度 px/s)",
      min: 0,
      max: 200,
      step: 10,
      default: 60,
      desc: "スクロールしていないときの流速。60〜100px/sが読める上限の目安。0にするとスクロール中だけ流れる。",
    },
    {
      key: "factor",
      label: "factor(スクロール加算の係数)",
      min: 1,
      max: 10,
      step: 0.5,
      default: 4,
      desc: "スクロール1pxを何pxの流れに変換するか。4前後で「スクロールに引っ張られる」感が出る。",
    },
    {
      key: "lerp",
      label: "lerp(慣性の粘り)",
      min: 0.05,
      max: 0.3,
      step: 0.01,
      default: 0.08,
      desc: "加算分が基本速度へ戻る速さ。小さいほど余韻が長く、止まったあとも滑走が残る。",
    },
  ],
  promptTemplate: `scroll-driven marquee を実装してください。

- テキストを2セット以上複製して横に並べ、translateX をループさせる(1セット分の幅を超えたら巻き戻す)
- requestAnimationFrame で毎フレーム offset を進める。基本速度は {{speed}}px/s(CSS animationではなくrAFで自前ループにする)
- 毎フレームの scrollY 差分 × {{factor}} を速度に加算し、lerp(係数 {{lerp}})で基本速度へ滑らかに戻す
- 下スクロールで加速、上スクロールでは速度が負になり逆流させる(負のoffsetのmodulo計算に注意)
- 移動は translateX のみで行い、will-change: transform を指定する(left等のアニメーション禁止)
- prefers-reduced-motion 時は自動の流れもスクロール加算も止め、静止したテキストとして表示する`,
  ngExample: {
    say: "「マーキーをスクロールに反応させて」",
    why: "「反応」が速度の加算なのか、スクロール量に位置を対応させるscrubなのか決まらない。CSS animationのままでは速度を動的に変えられないため中途半端な実装になりやすく、逆スクロールで巻き戻らないものも多い。",
  },
  okExample: {
    say: "「scroll-driven marqueeを実装。rAFで基本60px/s+毎フレームのscrollY差分×4を加算、lerp 0.08で基本速度へ復帰。逆スクロールで逆流を許容、2セット複製してtranslateXでシームレスループ」",
    why: "基本速度・加算係数・戻り・逆流の許容まで数値で指定している。「rAFで自前ループ」と伝えることで、速度を毎フレーム変えられる構造になる。",
  },
  vocab: [
    {
      term: "基本速度+加算",
      desc: "常時の等速にスクロール由来の速度を足す設計。止まっていても流れ続け、スクロールで表情が変わる。等速のみが通常のmarquee。",
    },
    {
      term: "シームレスループ",
      desc: "同じ内容を2セット以上並べ、1セット分進んだら巻き戻す手法。継ぎ目なく無限に流れているように見せる。",
    },
    {
      term: "velocity",
      desc: "スクロール速度。毎フレームのscrollY差分で求める。velocity-skewは同じ入力を「傾き」に使うが、本項は「流速」に使う。",
    },
    {
      term: "方向反転",
      desc: "速度が負になったとき逆向きに流すこと。offsetが負になるため、((offset % w) + w) % w で正の余りに正規化する。",
    },
    {
      term: "scrub",
      desc: "スクロール量に位置を1対1で対応させる方式。本項の速度加算とは別物で、scrubはスクロールが止まるとマーキーも止まる。",
    },
  ],
  related: ["marquee", "velocity-skew", "logo-marquee"],
};
