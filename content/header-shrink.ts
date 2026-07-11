import type { MotionEntry } from "@/lib/types";

export const headerShrink: MotionEntry = {
  slug: "header-shrink",
  category: "scroll",
  nameJa: "ヘッダーシュリンク",
  nameEn: "shrinking header / sticky header shrink",
  lede: "スクロールすると固定ヘッダーが低くなり、ロゴも小さくなってコンテンツの視界を広げる実務の超定番。閾値・縮小率・遷移時間の3つの数値がほぼすべてを決める。",
  params: [
    {
      key: "threshold",
      label: "threshold(発火するスクロール量 px)",
      min: 20,
      max: 200,
      step: 10,
      default: 80,
      desc: "縮み始めるスクロール量。60〜100pxが定番。小さすぎると最上部でチラつく。",
    },
    {
      key: "ratio",
      label: "ratio(縮小後の高さ比)",
      min: 0.4,
      max: 0.9,
      step: 0.05,
      default: 0.6,
      desc: "縮小後の高さ ÷ 元の高さ。0.6前後が自然。0.5を切るとナビが窮屈になる。",
    },
    {
      key: "duration",
      label: "duration(切り替えの時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      desc: "0.25〜0.35sが自然。0.5sを超えるとスクロールのたびにもたつく。",
    },
  ],
  promptTemplate: `固定ヘッダーに shrinking header を実装してください。

- ヘッダーは position: sticky(または fixed)で最上部に固定する
- scrollY が {{threshold}}px を超えたら縮小状態に切り替える。境界でのチラつきを防ぐため、戻す判定は発火より少し手前にする(ヒステリシス)
- 縮小状態では高さを元の {{ratio}} 倍にし、ロゴは transform: scale で同程度に縮める(高さはpaddingで作り、ロゴのfont-sizeは変えない)
- 遷移は {{duration}}s の ease で、高さとロゴのtransformを同時に動かす
- スクロール量に連続追従させず、閾値での2値のクラス切り替えにする
- 変種として「下スクロールで隠れ、上スクロールで現れる」auto-hide型もある。その場合はスクロール方向で translateY(-100%) を切り替える
- prefers-reduced-motion 時は遷移なしで状態だけ即座に切り替える`,
  ngExample: {
    say: "「スクロールしたらヘッダーを小さくして」",
    why: "閾値も縮小率も未指定。スクロール量に比例して高さを毎フレーム再計算するガタつく実装や、境界の上でスクロールが止まると縮む・戻るをチラチラ繰り返す実装が返ってくる。",
  },
  okExample: {
    say: "「shrinking headerを実装。scrollY 80pxで発火・戻りは60px(ヒステリシス)、高さ0.6倍・ロゴはscaleで縮小、0.3s ease、閾値での2値クラス切り替え」",
    why: "閾値・縮小率・時間に加えて「2値のクラス切り替え」まで指定している。連続追従かON/OFFかで実装が根本から変わり、安定するのは後者。",
  },
  vocab: [
    {
      term: "sticky / fixed",
      desc: "固定方法の2択。stickyはDOMの流れに残るため本文の余白調整が不要。fixedは本文にヘッダー分のpaddingが要る。",
    },
    {
      term: "ヒステリシス",
      desc: "発火の閾値と解除の閾値をずらすこと。境界上でスクロールが止まったときに縮む・戻るを繰り返すチラつきを防ぐ。",
    },
    {
      term: "auto-hide header",
      desc: "下スクロールで隠れ、上スクロールで現れる変種。smart header / hide on scroll とも呼ぶ。方向判定はscrollYの差分の符号で行う。",
    },
    {
      term: "2値切り替え",
      desc: "スクロール量に連続で追従させず、閾値でクラスをON/OFFする方式。実装が単純で挙動が安定し、CSS transitionに任せられる。",
    },
  ],
  related: ["footer-reveal", "scroll-progress", "smooth-scroll"],
};
