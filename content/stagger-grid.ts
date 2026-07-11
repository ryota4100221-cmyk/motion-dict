import type { MotionEntry } from "@/lib/types";

export const staggerGrid: MotionEntry = {
  slug: "stagger-grid",
  category: "loading",
  nameJa: "グリッド点灯",
  nameEn: "stagger grid loading / staggered grid reveal",
  lede: "ダッシュボードやギャラリーのカード群が、読み込み時に1枚ずつ時間差で点灯していく演出。遅延を(行+列)×staggerで計算すると光が左上から対角線に走り、一斉表示では出ない「画面が組み上がっていく」見せ場になる。",
  params: [
    {
      key: "stagger",
      label: "stagger(1枚あたりの遅延 s)",
      min: 0.02,
      max: 0.2,
      step: 0.01,
      default: 0.06,
      desc: "隣のカードとの時間差。0.04〜0.08sが目安。枚数が多い画面で0.1sを超えると最後のカードまで待たされる。",
    },
    {
      key: "duration",
      label: "duration(1枚の点灯時間 s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.45,
      desc: "各カードのフェード時間。0.4〜0.6sが自然。staggerより十分長くすると前後のカードが重なって流れて見える。",
    },
    {
      key: "direction",
      label: "direction(点灯の進行方向)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["diagonal", "row", "column"],
      desc: "遅延の計算式の切り替え。diagonalは(行+列)×staggerで、同じ和のカードが同時に点き光が対角線に走る。",
    },
  ],
  promptTemplate: `カードグリッドに stagger grid loading(時間差の点灯)を実装してください。

- 各カードは opacity: 0 と translateY(8px) で隠しておき、表示時に opacity 1・translateY(0) へ {{duration}}s の ease-out でフェードインさせる
- 遅延は行番号(row)と列番号(col)から計算する。方向は {{direction}}。diagonal なら delay = (row + col) × {{stagger}}s、row なら row × {{stagger}}s、column なら col × {{stagger}}s
- 遅延は animation-delay(または transition-delay)で与え、JSのタイマーを枚数分発行しない
- animation-fill-mode: both を指定し、delay中もカードが opacity 0 のまま保たれるようにする
- opacity と transform のみ動かし、リフローさせない
- カード総数が多い場合は最大遅延が1.5sを超えないよう stagger を落とす
- prefers-reduced-motion 時は遅延・アニメーションなしで全カードを即時表示する`,
  ngExample: {
    say: "「カードをパラパラっと順番に表示して」",
    why: "「順番」の定義(何を基準に何秒ずつ遅らせるか)がないため、配列のindex×一定秒の単調な流れ方や、setTimeoutを枚数分発行する重い実装が返ってくる。グリッドで行×列を無視した順番は視線の流れと合わない。",
  },
  okExample: {
    say: "「stagger grid loadingを実装。各カードopacity 0→1とtranslateY 8px→0を0.45s ease-out、delay = (row + col) × 0.06sで左上から対角線に点灯。CSSのanimation-delay + fill-mode: bothで制御、reduced-motionでは即時表示」",
    why: "遅延の計算式・方向・数値・CSSだけで完結する実装方式まで指定している。「(row+col)×stagger」の一言で光が対角線に走り、fill-mode指定がdelay中のチラ見えを防ぐ。",
  },
  vocab: [
    {
      term: "スタッガー(stagger)",
      desc: "複数要素を一定の時間差で順に動かすこと。一斉に動かすより1枚1枚の存在が目に入り、点数の多さがそのまま演出になる。",
    },
    {
      term: "(row+col)遅延",
      desc: "行番号+列番号を遅延の係数にする計算。和が同じカードは同時に点灯するため、点灯の波が対角線として見える。",
    },
    {
      term: "animation-delay",
      desc: "アニメーションの開始をずらすCSSプロパティ。全カードの開始時刻をCSSだけで制御でき、JSタイマーの乱発より正確で軽い。",
    },
    {
      term: "fill-mode: backwards / both",
      desc: "delay中もキーフレームの開始状態(opacity 0)を適用させる指定。これがないと遅延待ちのカードが一瞬素の状態で見えてしまう。",
    },
  ],
  related: ["skeleton-shimmer", "scroll-fade-in", "mosaic-reveal"],
};
