import type { MotionEntry } from "@/lib/types";

export const pageTurn: MotionEntry = {
  slug: "page-turn",
  category: "ui",
  nameJa: "ページめくり",
  nameEn: "page turn / page flip / flipbook effect / book page flip",
  lede: "紙のページが綴じ目（背）を軸に起き上がり、向こう側へ倒れて裏面を見せる動き。カードの裏返しと違って回転軸が中心ではなく端にあり、めくった紙が左に積もっていくので、「次へ進んだ」「ここまで読んだ」という順番の感覚をそのまま伝えられる。",
  params: [
    {
      key: "duration",
      label: "duration(1枚めくる時間 s)",
      min: 0.3,
      max: 2.4,
      step: 0.05,
      default: 1.1,
      desc: "0.8〜1.2sが紙らしい。0.5sを切ると「パタン」と板が倒れる音に見え、1.8sを超えるとめくり待ちが長くて操作の応答として遅い。",
    },
    {
      key: "perspective",
      label: "perspective(視点までの距離 px)",
      min: 300,
      max: 3000,
      step: 50,
      default: 1200,
      desc: "ページ幅の4〜6倍が自然(幅240pxなら1000〜1400px)。小さいほど起き上がった紙が手前に迫って立体的になり、2500pxを超えるとほぼ平面の横つぶし(scaleX)と見分けがつかない。",
    },
    {
      key: "shade",
      label: "shade(めくり途中の陰り %)",
      min: 0,
      max: 70,
      step: 1,
      default: 35,
      desc: "紙が垂直に立った瞬間に表面へ乗せる影の濃さ。25〜40%で「光を受けて傾いている」と読める。0だと向きが変わっても明るさが一定で、厚紙の板が回っているように見える。",
    },
  ],
  promptTemplate: `本・カタログ・オンボーディングの手順表示に page turn(ページめくり)を実装してください。

- 1枚のページ(leaf)は表(front)と裏(back)の2面を重ねた要素にし、親に transform-style: preserve-3d、各面に backface-visibility: hidden を指定する。裏面は最初から rotateY(180deg) で裏返して置く
- 回転軸は綴じ目側。transform-origin: left center(右ページを左へめくる場合)にし、transform: perspective({{perspective}}px) rotateY(0deg) → rotateY(-180deg) で倒す。中心軸の rotateY(カードの裏返し)にしない
- 1枚のめくりは {{duration}}s。イージングは cubic-bezier(0.45, 0, 0.25, 1)(持ち上げはゆっくり、倒れ込みは少し速く)
- めくり途中は、表面に黒のグラデーション(綴じ目側が濃い)を重ね、その opacity を 0 → {{shade}}% → 0(垂直に立つ中間で最大)で動かして陰りを出す。box-shadow は動かさない
- 重なり順: まだめくっていないページは先頭ほど上、めくったページは後からめくったほど上、今めくっている1枚は常に最上位にする(z-index を状態で付け替える)
- 次へ/前へのボタンとキー操作(←→)で1枚ずつ進退できるようにし、連打されたら前のめくりの完了を待たず次の1枚を始める
- prefers-reduced-motion 時は回転させず、ページの中身をクロスフェード(0.2s程度)で切り替えるだけにする`,
  ngExample: {
    say: "「本のページをめくるアニメーションを付けて」",
    why: "「めくる」だけだと、カードの中心で裏返る rotateY(180deg) や、横にスライドするだけのカルーセルが返ってきやすい。回転軸・遠近・重なり順が決まらないので、めくった紙が次のページの下に潜り込んだり、裏面が鏡文字で透けたりする。",
  },
  okExample: {
    say: "「page turnを実装。表裏2面をpreserve-3d+backface-visibility:hiddenで持つleafを、transform-origin:left centerでperspective(1200px) rotateY(0→-180deg)、1.1s cubic-bezier(0.45,0,0.25,1)。途中で表面に陰り35%。めくり中の1枚を最上位に。reduced-motionはクロスフェードのみ」",
    why: "回転軸を綴じ目に置くことと表裏2面の構造、遠近・時間・陰りの数値、重なり順のルールまで指定している。z-index の一言で「めくった紙が潜り込む」事故を防げる。",
  },
  vocab: [
    {
      term: "leaf(リーフ)",
      desc: "表と裏の2ページを持つ1枚の紙。page turn はページ単位ではなくリーフ単位で回転させる(1回めくると2ページ進む)。",
    },
    {
      term: "spine(綴じ目・背)",
      desc: "ページが綴じられている側の辺。transform-origin をここに置くのが、中心で回るフリップカードとの決定的な違い。",
    },
    {
      term: "backface-visibility",
      desc: "要素が裏返ったときに背面を描くかどうか。hidden にしないと、めくった紙の表が鏡文字で透けて見える。",
    },
    {
      term: "preserve-3d",
      desc: "子要素を親と同じ3D空間に置く指定。表裏2面を1枚として一緒に回転させるのに必要。",
    },
    {
      term: "page curl(ページカール)",
      desc: "紙の角が丸く巻き上がる表現。平面のまま倒す page turn より写実的だが、canvas や WebGL が要ることが多い。",
    },
  ],
  related: ["flip-card", "card-shuffle", "stacking-cards"],
};
