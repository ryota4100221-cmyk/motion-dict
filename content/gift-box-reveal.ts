import type { MotionEntry } from "@/lib/types";

export const giftBoxReveal: MotionEntry = {
  slug: "gift-box-reveal",
  category: "ui",
  nameJa: "ギフトボックスの予告（フタが跳ねる）",
  nameEn: "gift box animation / mystery box tease / gift reveal",
  lede: "特典ポップアップのギフト箱で、フタだけが奥の角を蝶番にして2度ぴょこっと持ち上がり、そのあいだに周りのきらめきが膨らんで灯る演出。2度目を1度目の半分以下に減衰させ、傾きの向きを逆にすることで「中で何かが動いた」手応えになり、開ける前から報酬を予告できる。",
  params: [
    {
      key: "lift",
      label: "lift(1度目の持ち上がり px)",
      min: 4,
      max: 32,
      step: 1,
      default: 14,
      desc: "フタが真上に浮く量。箱の幅の0.15〜0.2倍が自然（76px幅の箱で14px）。25pxを超えるとフタが外れて飛んだように見え、予告ではなく開封になる。",
    },
    {
      key: "tilt",
      label: "tilt(1度目の傾き deg)",
      min: 0,
      max: 20,
      step: 1,
      default: 9,
      desc: "奥の角（左下18%）を軸にした回転。8〜10°で片側だけ浮いた「覗き」に見える。0にすると平行に浮くだけで、蓋が弾んだ感じが消える。",
    },
    {
      key: "peeks",
      label: "peeks(跳ねる回数)",
      min: 1,
      max: 4,
      step: 1,
      default: 2,
      desc: "フタが浮いて戻る回数。2回目以降は前回の約0.45倍に減衰し、傾きの向きを毎回反転させる。2回が定番で、1回だと単なる会釈、4回だとガタつきに見える。",
    },
    {
      key: "duration",
      label: "duration(全体の尺 s)",
      min: 0.6,
      max: 2.4,
      step: 0.1,
      default: 1.3,
      desc: "フタの跳ねときらめきに共通の尺。1.1〜1.5sが目で追える範囲。カードの登場から0.3s遅らせて始めると、カードが落ち着いてから箱が動く順になる。",
    },
  ],
  promptTemplate: `特典ポップアップのギフト箱に gift box animation(mystery box tease)を実装してください。

- 箱はSVGで「本体」と「フタ（リボンと結び目を含む）」を別の <g> に分け、動かすのはフタの <g> だけにする
- フタは transform-box: fill-box; transform-origin: 18% 100%（奥の左下の角）を蝶番にする
- フタを {{peeks}} 回浮かせて戻す。1回目は translateY(-{{lift}}px) rotate(-{{tilt}}deg)、2回目以降は前回の0.45倍の量に減衰させ、rotate の符号を毎回反転させる（-9°→+4°のように）。各回の頂点は区間の前寄り（1回目は区間の50%、2回目以降は36%）に置き、区間の終わりで必ず transform: none に戻す
- 全体の尺は {{duration}}s、ease-out をキーフレームの区間ごとにかけ、カードの登場から0.3s遅らせて1回だけ再生する
- 箱の周りに「+」形のきらめきを3つ置き、フタと同じ尺・遅延で 0〜20% は opacity 0 / scale(0.6) のまま待機、45% で opacity 1 / scale(1.1) まで膨らませ、100% で scale(1) に落ち着かせて残す
- 動かすのは transform と opacity だけ（y や width を動かさない＝リフロー禁止）。fill-mode: both で開始前と終了後の姿を固定する
- 箱を押したら頭から再生し直す（animation を cancel してから再生）。箱はヒット領域44px以上のボタンにして aria-label を付ける
- prefers-reduced-motion 時はフタを動かさず、きらめきを最初から灯った状態で静止表示する`,
  ngExample: {
    say: "「ポップアップのプレゼント箱をワクワクする感じに動かして」",
    why: "どこを・どう動かすかが決まらない。箱全体を左右に揺らす shake か、scale で膨らむバウンスが返ってきがちで、どちらも「箱が震えた」以上の意味を持たない。フタの蝶番位置や減衰の指定が無いので、フタが真上に飛んで戻る不自然な往復になることも多い。",
  },
  okExample: {
    say: "「gift box tease を1.3s・0.3s遅延で。フタの<g>だけを transform-origin 18% 100% で2回跳ねさせる（-14px/-9° → -6px/+4°、頂点は25%と68%、各区間 ease-out）。きらめき3つは20%まで待機→45%でscale 1.1→1。transformのみ・押したら頭から・reduced-motionはフタ静止できらめき常時表示」",
    why: "動かす部位・蝶番の位置・2回の量と向き・頂点のタイミング・きらめきの出番まで指定。「フタだけ」「減衰して向きが反転」の2点で、箱が揺れたのではなく中身が動いたように見える。",
  },
  vocab: [
    {
      term: "gift box animation / mystery box",
      desc: "クーポンや特典の入口にギフト箱を置き、開ける前に動かして中身を予告する演出。ゲーミフィケーション型ポップアップ（spin to win・scratch card と同じ系統）で定番。",
    },
    {
      term: "anticipation",
      desc: "本番の動き（開封）の前に、それを予感させる小さな予備動作を入れるアニメーションの原則。ここではフタの跳ねが開封の予告になる。",
    },
    {
      term: "transform-box: fill-box",
      desc: "SVG要素の transform-origin を、その要素自身の外接矩形を基準に解釈させる指定。これが無いとSVG全体の左上が原点になり、蝶番の位置がずれる。",
    },
    {
      term: "damped oscillation",
      desc: "揺れるたびに振幅が減っていく減衰振動。2回目を前回の半分以下にすると、物が自然に落ち着く動きになる。",
    },
    {
      term: "animation-fill-mode: both",
      desc: "遅延中は0%の姿、終了後は100%の姿を保つ指定。きらめきを遅延中は隠し、終了後は灯したまま残すために使う。",
    },
  ],
  related: ["scratch-card", "prize-wheel", "like-burst", "hint-nudge"],
};
