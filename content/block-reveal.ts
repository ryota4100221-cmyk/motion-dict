import type { MotionEntry } from "@/lib/types";

export const blockReveal: MotionEntry = {
  slug: "block-reveal",
  category: "text",
  nameJa: "ブロックリビール",
  nameEn: "block reveal / bar wipe reveal",
  lede: "色ベタのバーが単語の上を左から右へ通り抜け、通過した瞬間に文字が現れるテキスト演出。marker-line(マーカーが引かれて残る)と違いバーは残らず、split-text-reveal(マスクからせり上がる)より力強い「めくり」の印象になる。",
  params: [
    {
      key: "duration",
      label: "duration(バーが通り抜ける時間 s)",
      min: 0.4,
      max: 1.6,
      step: 0.05,
      default: 0.8,
      desc: "行き(覆う)と帰り(抜ける)の合計。0.7〜0.9sが小気味よい。1.2sを超えると見出しが読めるまで待たされる。",
    },
    {
      key: "stagger",
      label: "stagger(単語ごとの遅れ ms)",
      min: 0,
      max: 300,
      step: 10,
      default: 120,
      desc: "100〜150msで「1語ずつ読ませる」テンポ。0だと全語同時で1枚のバーに見え、300msに近づくと待ち時間が目立つ。",
    },
    {
      key: "pivot",
      label: "pivot(文字が現れる位置 %)",
      min: 30,
      max: 70,
      step: 5,
      default: 50,
      desc: "バーが折り返して文字を出す瞬間の進行率。50%が基本。小さいほど早く読め、大きいほど「隠されていた」感が強まる。",
    },
    {
      key: "barHeight",
      label: "barHeight(バーの高さ %)",
      min: 60,
      max: 140,
      step: 10,
      default: 100,
      desc: "文字の行高に対する比率。100%で文字をちょうど覆う。120%前後にすると版ズレのような余裕が出る。",
    },
  ],
  promptTemplate: `見出しに block reveal(バーワイプ)を実装してください。

- 見出しを単語ごとに <span> で包み、各単語に position: absolute の擬似要素でベタ塗りのバーを重ねる
- バーの高さは単語の行高の {{barHeight}}% にする
- バーは transform: scaleX() で動かす(width は使わない・リフロー禁止)
- 進行率 {{pivot}}% までは transform-origin: left で scaleX(0→1)、そこで origin を right に切り替えて scaleX(1→0) に抜ける
- 単語の文字は初期 opacity: 0 とし、{{pivot}}% の時点で opacity: 1 に切り替える(バーの陰で入れ替える)
- 1単語あたり {{duration}}s、単語ごとに {{stagger}}ms ずつ遅らせる
- イージングは cubic-bezier(0.76, 0, 0.24, 1) のような in-out 系を使う
- prefers-reduced-motion: reduce のときはバーを一切出さず、文字を最初から opacity: 1 で表示する`,
  ngExample: {
    say: "「見出しをかっこよく出して」",
    why: "フェードインかせり上がりが返ってくる。バーが通過して文字が入れ替わるという構造が伝わらず、「バーが引かれたまま残る」マーカー実装になることも多い。",
  },
  okExample: {
    say: "「block revealで。単語ごとにバーをscaleXで左origin→50%でright originに反転して抜き、その瞬間に文字をopacity 0→1。0.8s / stagger 120ms、widthは使わずtransformのみ」",
    why: "「originを反転させる」「50%で文字を入れ替える」という要の2点を指定している。ここを言わないと、行きと帰りが同じ方向のただのワイプになる。",
  },
  vocab: [
    {
      term: "transform-origin",
      desc: "変形の基準点。行きは left、帰りは right に切り替えることで「バーが通り抜けた」ように見える。block revealの肝。",
    },
    {
      term: "scaleX",
      desc: "横方向の拡縮。widthやclip-pathより軽く、GPU合成に乗るのでバーのワイプはこれで作る。",
    },
    {
      term: "stagger",
      desc: "複数要素に少しずつ遅延を付けること。単語ごとにずらすと視線が左から右へ引かれる。",
    },
    {
      term: "swap point(入れ替え点)",
      desc: "バーが完全に覆っている一瞬。ここで文字のopacityを切り替えるので、切り替え自体は見えない。",
    },
  ],
  related: ["split-text-reveal", "marker-line", "curtain-wipe"],
};
