import type { MotionEntry } from "@/lib/types";

export const dropdownReveal: MotionEntry = {
  slug: "dropdown-reveal",
  category: "ui",
  nameJa: "ドロップダウンリビール",
  nameEn: "dropdown reveal / dropdown menu animation",
  lede: "ナビ項目のホバーやクリックで小さなメニューがふわっと開く動き。opacity・translateY・scaleを重ねた複合トランジションと、ホバーが外れてもすぐ閉じない「猶予時間」の設計が使い勝手を分ける。画面全体を覆うmenu reveal(フルスクリーンメニュー)とは別物。",
  params: [
    {
      key: "duration",
      label: "duration(開く時間 s)",
      min: 0.1,
      max: 0.6,
      step: 0.05,
      default: 0.2,
      desc: "0.15〜0.25sが快適。ナビは1日に何度も触るUIなので、演出より速さを優先する。",
    },
    {
      key: "offset",
      label: "offset(浮き上がり距離 px)",
      min: 2,
      max: 16,
      step: 1,
      default: 8,
      desc: "閉状態でのtranslateY(-offset)。6〜10pxで「ふわっ」と感じる。16pxを超えると飛んで見える。",
    },
    {
      key: "closeDelay",
      label: "closeDelay(閉じるまでの猶予 s)",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.3,
      desc: "ホバーが外れてから閉じ始めるまでの猶予。0.2〜0.4sあると斜め移動でメニューが消えない。",
    },
  ],
  promptTemplate: `ナビゲーションに dropdown reveal(ドロップダウンメニューの開閉アニメーション)を実装してください。

- メニューはトリガーの直下に absolute 配置し、閉状態は opacity 0 / translateY(-{{offset}}px) / scale(0.98) / visibility: hidden にしておく
- ホバー(タッチデバイスはタップ)で opacity 1 / translateY(0) / scale(1) に、{{duration}}s の ease-out で開く。transform-origin は top にする
- 閉じるときはアニメーションさせず瞬時に消す(出は速く・戻りは即時の非対称)
- ホバーがトリガーとメニューの両方から外れてから {{closeDelay}}s 待って閉じる(猶予中に戻ればタイマーをキャンセル)。トリガーとメニューは同じ親要素で包み、離脱判定は親で行う
- 閉状態は visibility: hidden も切り替え、見えないメニューがクリックを奪わないようにする
- 動かすのは opacity と transform のみ。height のアニメーションでリフローさせない
- prefers-reduced-motion 時は transform を動かさず、opacity の短いフェード(0.1s程度)だけで開閉する`,
  ngExample: {
    say: "「ナビにホバーでメニューが出るようにして」",
    why: "開き方も閉じ方も猶予も未定義。display: none/blockの切り替えだけの実装や、heightをアニメーションさせるリフロー実装が返ってきやすい。猶予がないとメニューへマウスを移動する途中で閉じてしまい、使いものにならない。",
  },
  okExample: {
    say: "「dropdown revealを実装。閉状態はopacity 0+translateY(-8px)+scale(0.98)、ホバーで0.2s ease-outで開く。閉じは瞬時、ただし離脱から0.3sの猶予付き。visibilityも切り替えてtransformとopacityのみで」",
    why: "複合トランジションの内訳・開閉の非対称・猶予時間・クリック透過対策まで指定。「閉じは瞬時+猶予0.3s」の2点がドロップダウンの体感品質をほぼ決める。",
  },
  vocab: [
    {
      term: "hover intent",
      desc: "ホバー離脱後すぐ閉じずに猶予を置く設計。トリガーからメニューへの斜め移動を許容するための定番テクニック。",
    },
    {
      term: "transform-origin: top",
      desc: "scaleの基準点を上辺にする指定。トリガー側から生えてくるように開き、宙に浮いた印象を消す。",
    },
    {
      term: "visibility切り替え",
      desc: "opacity 0だけでは要素が残りクリックを奪う。visibility: hiddenを併用して不可視時は操作不能にする。",
    },
    {
      term: "in-out非対称",
      desc: "開きはアニメーション・閉じは瞬時のように出入りを変える設計。閉じを丁寧に見せる必要はほぼない。",
    },
  ],
  related: ["menu-reveal", "tooltip-pop", "drawer-slide"],
};
