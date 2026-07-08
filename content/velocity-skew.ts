import type { MotionEntry } from "@/lib/types";

export const velocitySkew: MotionEntry = {
  slug: "velocity-skew",
  category: "scroll",
  nameJa: "速度スキュー",
  nameEn: "velocity skew / scroll skew",
  lede: "スクロールの速さに応じてテキストが傾き、止まるとすっと元に戻る動き。速く動かすほど大きく歪み、慣性と勢いを視覚化する。Awwwards系ポートフォリオの定番演出。",
  params: [
    {
      key: "factor",
      label: "factor(速度→傾きの係数)",
      min: 0.1,
      max: 1.5,
      step: 0.05,
      default: 0.5,
      desc: "速度をどれだけ傾きに変換するか。0.5前後で「勢いよく流れる」感が出る。",
    },
    {
      key: "maxSkew",
      label: "maxSkew(最大傾き deg)",
      min: 2,
      max: 20,
      step: 1,
      default: 8,
      desc: "傾きの上限。8deg前後が実用の限界。それ以上は文字が読めなくなる。",
    },
    {
      key: "lerp",
      label: "lerp(戻りの粘り)",
      min: 0.05,
      max: 0.3,
      step: 0.01,
      default: 0.1,
      desc: "止まったあと0degへ戻る速さ。小さいほど余韻が長く残る。",
    },
  ],
  promptTemplate: `スクロール中のテキストに velocity skew を実装してください。

- 毎フレーム scrollY の差分からスクロール速度を計算する(requestAnimationFrame使用)
- 速度 × {{factor}} を skewY の目標値にし、±{{maxSkew}}deg でクランプする
- 現在値は lerp(係数 {{lerp}})で目標に追従させ、スクロールが止まったら 0deg に戻す
- transform は skewY のみで位置は動かさず、対象に will-change: transform を指定する
- prefers-reduced-motion 時はスキューを無効化する`,
  ngExample: {
    say: "「スクロールで文字がグニャってなるやつやって」",
    why: "「グニャ」がskewなのかブラーなのか液体的な変形なのか不明。速度との対応・傾きの上限・止まったときの挙動も未定義で、傾いたまま戻らない実装や読めないほど歪む実装が返ってくる。",
  },
  okExample: {
    say: "「velocity skewを実装。毎フレームのscrollY差分×0.5をskewYに、±8degでクランプ、lerp 0.1で追従して停止時は0degへ」",
    why: "速度の求め方・係数・上限・戻りの挙動まで数値で揃っている。クランプと「停止時に0へ戻す」は言わないと確実に壊れるポイント。",
  },
  vocab: [
    {
      term: "velocity",
      desc: "スクロール速度。毎フレームのscrollY差分で求めるのが最も簡単で、ライブラリなしで実装できる。",
    },
    {
      term: "skewY",
      desc: "縦方向のせん断変形。行が平行四辺形に傾き、疾走感の表現になる。skewXは横倒れで別物。",
    },
    {
      term: "clamp",
      desc: "値を上限・下限の範囲に収めること。傾けすぎによる可読性の崩壊を防ぐ安全装置。",
    },
    {
      term: "減衰",
      desc: "入力が止まったあと値が0へ戻っていくこと。lerpの係数が戻りの余韻の長さを決める。",
    },
  ],
  related: ["parallax", "marquee"],
};
