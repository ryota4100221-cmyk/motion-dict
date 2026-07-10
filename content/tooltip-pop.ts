import type { MotionEntry } from "@/lib/types";

export const tooltipPop: MotionEntry = {
  slug: "tooltip-pop",
  category: "ui",
  nameJa: "ツールチップポップ",
  nameEn: "tooltip / hint popup",
  lede: "ホバーした要素の近くに小さな補足がふっと現れる演出。即出すとカーソルが通過するたびにチラつくため、出現に0.3s前後の遅延(hover intent)を入れるのが定石。出は遅延なしで即座に消す。",
  params: [
    {
      key: "delay",
      label: "delay(出現遅延 s)",
      min: 0,
      max: 1.5,
      step: 0.05,
      default: 0.3,
      desc: "ホバーしてから出るまでの待ち時間。0.2〜0.5sが定石。0だと通過しただけでチラつく。",
    },
    {
      key: "duration",
      label: "duration(ポップ時間 s)",
      min: 0.1,
      max: 0.8,
      step: 0.05,
      default: 0.2,
      desc: "出現アニメーション自体の時間。0.15〜0.25sで十分。長いともたついて見える。",
    },
  ],
  promptTemplate: `ホバーで補足を表示する tooltip を実装してください。

- 対象にホバーしてから {{delay}}s 待ってから表示する(hover intent。カーソルが通過しただけでは出さない)
- 出現は {{duration}}s の ease-out で、opacity 0→1 と transform: translateY(4px) scale(0.96) → 等倍 のポップにする。transform-origin は矢印側(対象に近い辺の中央)に置く
- マウスが離れたら遅延なしで即座に消す。出は入りより短い0.1s前後のフェードのみでよい
- 動かすのは transform と opacity のみ。display切替だけのON/OFFにしない
- prefers-reduced-motion 時は transform を使わず opacity の短いフェードのみにする`,
  ngExample: {
    say: "「ホバーで説明がポップアップするようにして」",
    why: "遅延の指定がないと即時表示になり、カーソルが通るたびにチラついてうるさいUIになる。display切替だけでアニメーションが一切ない実装が返ってくることも多い。",
  },
  okExample: {
    say: "「tooltipはhoverの0.3s後に表示。0.2s ease-outでopacity+translateY(4px)+scale(0.96)からポップ、originは下辺中央。leaveは遅延なしで即フェードアウト」",
    why: "hover intentの遅延・出現の変形量・出入りの非対称まで数値で指定。「即消す」の一言でチラつきと待たされ感の両方を防げる。",
  },
  vocab: [
    {
      term: "hover intent",
      desc: "「本当にそこへ留まったか」を出現遅延で判定する考え方。ツールチップの品質はほぼこれで決まる。",
    },
    {
      term: "transform-origin",
      desc: "ポップの基準点。矢印側(対象に近い辺)に置くと「そこから生えた」ように見える。",
    },
    {
      term: "出入り非対称",
      desc: "入りは遅延+ポップ、出は即時フェード。逆にすると鬱陶しいUIになる。",
    },
    {
      term: "tooltip / popover",
      desc: "ホバーで出る小さな補足がtooltip、クリックで開く操作可能な浮き要素がpopover。呼び分けると意図が伝わる。",
    },
  ],
  related: ["toast-slide", "lift-hover"],
};
