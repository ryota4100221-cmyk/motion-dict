import type { MotionEntry } from "@/lib/types";

export const horizontalScroll: MotionEntry = {
  slug: "horizontal-scroll",
  category: "scroll",
  nameJa: "横スクロールセクション",
  nameEn: "horizontal scroll section / vertical-to-horizontal scroll",
  lede: "縦のスクロール量を横の移動量に変換し、固定した画面の中をコンテンツが横に流れていくギャラリー定番の演出。作品一覧や工程紹介を、ページの流れを止めずに横長で見せられる。",
  params: [
    {
      key: "distance",
      label: "distance(横移動距離 画面幅比)",
      min: 1,
      max: 3,
      step: 0.5,
      default: 2,
      desc: "横に動かす距離をビューポート幅の何倍にするか。この分だけ親セクションを高くする。2倍前後が疲れない。",
    },
    {
      key: "smooth",
      label: "smooth(追従のなめらかさ)",
      min: 0.05,
      max: 1,
      step: 0.05,
      default: 0.12,
      desc: "lerpの補間係数。1で即追従、0.08〜0.15で慣性が乗ったようなぬるっとした動きになる。0.05以下は酔いやすい。",
    },
  ],
  promptTemplate: `縦スクロールに連動する horizontal scroll section を実装してください。

- 親セクションの高さを「画面高さ + 画面幅 × {{distance}}」にし、その中に position: sticky; top: 0 で画面いっぱいのビューポートを固定する
- ビューポート内に横並びのトラック(flex)を置き、セクション内のスクロール進捗0〜1を translateX(0 〜 −画面幅×{{distance}}) に変換する
- 目標値へ直接飛ばさず、毎フレーム current += (target − current) × {{smooth}} の線形補間(lerp)で追従させる
- 書き込みは requestAnimationFrame 側で transform: translate3d のみ。left や margin は使わない(リフロー禁止)
- wheelイベントを乗っ取るスクロールハイジャックは実装しない(縦スクロールの主導権はユーザーに残す)
- 祖先の overflow: hidden は sticky を殺すので、はみ出し対策には overflow: clip を使う
- prefers-reduced-motion 時は lerp を切ってスクロールに1:1で即追従させるか、通常の縦積みレイアウトに戻す`,
  ngExample: {
    say: "「スクロールしたら横に流れるギャラリーセクションを作って」",
    why: "wheelイベントを乗っ取って横スクロールに変換する『ハイジャック』実装が返ってきやすい。トラックパッドの慣性やスマホで破綻し、戻る操作も効かなくなる。移動距離とセクションの高さの関係も未定義のまま。",
  },
  okExample: {
    say: "「horizontal scrollをsticky + translateXで実装。親は100vh+200vwの高さ、進捗を0〜-200vwに変換、lerp係数0.12で追従、書き込みはrAFでtranslate3dのみ。reduced-motion時は縦積みに戻す」",
    why: "縦量→横量の変換式・親の高さ・慣性の係数まで指定している。「sticky + translateX」の一言でハイジャック実装を確実に封じられる。",
  },
  vocab: [
    {
      term: "縦量→横量の変換",
      desc: "縦に消化したスクロール量をそのまま横の移動量に写す考え方。「親の余分な高さ＝横に動かしたい距離」が基本式。",
    },
    {
      term: "lerp(線形補間)",
      desc: "current += (target − current) × k で目標へ少しずつ寄せる補間。kが小さいほど遅れてついてくる＝慣性に見える。",
    },
    {
      term: "position: sticky",
      desc: "横移動中に画面を固定する土台。JSでfixedを付け外しするより堅牢で、解除位置がズレない。",
    },
    {
      term: "translate3d",
      desc: "GPU合成されるtransform。横移動はこれ一択で、leftやmargin-leftはリフローが走るため禁止。",
    },
  ],
  related: ["sticky-pin", "marquee", "parallax"],
};
