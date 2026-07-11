import type { MotionEntry } from "@/lib/types";

export const footerReveal: MotionEntry = {
  slug: "footer-reveal",
  category: "scroll",
  nameJa: "フッターリビール",
  nameEn: "footer reveal / fixed footer reveal",
  lede: "フッターをビューポート下に固定しておき、スクロール終端で本文が捲れるとその下からフッターが現れる演出。position: fixed・本文のmargin-bottom・z-indexの3点セットで成立する。",
  params: [
    {
      key: "height",
      label: "height(フッターの高さ px)",
      min: 80,
      max: 180,
      step: 10,
      default: 120,
      desc: "そのまま「捲れ」区間の深さになる。実サイトでは100〜400px程度。深いほど演出は劇的だが、連絡先が遠くなる。",
    },
    {
      key: "lift",
      label: "lift(せり上がり量 px)",
      min: 0,
      max: 40,
      step: 2,
      default: 16,
      desc: "露出に合わせてフッターがtranslateYでせり上がる距離。0で完全固定。10〜20pxで奥行きが出る。",
    },
    {
      key: "dim",
      label: "dim(隠れているときの暗さ)",
      min: 0,
      max: 0.8,
      step: 0.05,
      default: 0.45,
      desc: "捲れ始めのフッターに掛ける暗幕の濃さ。露出につれて0へ。0.4前後で「奥から現れる」遠近感が出る。",
    },
  ],
  promptTemplate: `ページ最下部に footer reveal を実装してください。

- フッターは position: fixed; bottom: 0 で固定し、高さを {{height}}px にする
- 本文(フッター以外を包むラッパー)に margin-bottom: {{height}}px を確保し、背景色を必ず不透明にする(透けるとフッターが常に見えてしまう)
- 重なり順は本文が上・フッターが下(本文: position: relative; z-index: 1 / フッター: z-index: 0)
- スクロール終端に近づいたら露出率(0〜1)を「スクロール残量 ÷ フッター高さ」で計算する
- 露出率に合わせてフッターを translateY({{lift}}px → 0) でせり上げる
- フッターに rgba(0, 0, 0, {{dim}}) の暗幕を重ね、露出率に合わせて0までフェードさせる
- prefers-reduced-motion 時は translateY と暗幕を無効化し、固定表示のみにする`,
  ngExample: {
    say: "「ページの最後でフッターがめくれて出てくるやつにして」",
    why: "仕組み(fixed+margin-bottom+z-index)が伝わらないと、フッターをsticky bottomにしただけのものや、本文の背景が透けてフッターが常時見えている壊れた実装が返ってくる。",
  },
  okExample: {
    say: "「footer revealを実装。フッターはfixed bottom・高さ120px・z-index 0。本文はrelative z-index 1・不透明背景・margin-bottom 120px。露出率に合わせてtranslateY 16px→0、暗幕0.45→0」",
    why: "3点セット(fixed / margin-bottom / z-index)と本文の不透明背景まで指定している。この演出の不具合は9割が「本文が透けている」ことに起因する。",
  },
  vocab: [
    {
      term: "margin-bottom方式",
      desc: "本文の下端にフッターと同じ高さの余白を確保し、スクロール可能量を伸ばす手法。この演出の核で、余白の分だけ本文が捲れる。",
    },
    {
      term: "z-index設計",
      desc: "本文が上・フッターが下という重なり順。逆にするとフッターが常に本文を覆う。本文側にposition指定がないとz-indexは効かない。",
    },
    {
      term: "露出率(progress)",
      desc: "フッターが見えている割合(0〜1)。スクロール残量 ÷ フッター高さで求め、せり上がりや暗幕の補間に使う。",
    },
    {
      term: "暗幕(scrim)",
      desc: "露出前のフッターに重ねる半透明の黒。捲れた本文の「奥」から現れる遠近感を作る。opacityだけで動かす。",
    },
  ],
  related: ["header-shrink", "parallax", "sticky-pin"],
};
