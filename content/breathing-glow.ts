import type { MotionEntry } from "@/lib/types";

export const breathingGlow: MotionEntry = {
  slug: "breathing-glow",
  category: "ui",
  nameJa: "ブリージング（呼吸する光）",
  nameEn: "breathing glow / breathing animation / breathing light / glow pulse",
  lede: "ステータスの点やカードの光彩が、その場でゆっくり膨らんでは引く「呼吸」のループ。何かを放つパルスリングと違って位置も輪郭も動かさず、光の強さと大きさだけを正弦波で行き来させるので、「稼働中・待機中・注目のプラン」を急かさずに伝えられる。",
  params: [
    {
      key: "period",
      label: "period(1呼吸の周期 s)",
      min: 1,
      max: 8,
      step: 0.1,
      default: 3.2,
      desc: "吸って吐いて1周の秒数。2.5〜4sが安静時の呼吸(毎分15〜24回)に近く落ち着く。1.5sを切ると心拍や警告の点滅に見え、6sを超えると動いていることに気付かれにくい。",
    },
    {
      key: "glow",
      label: "glow(吸い切ったときの光のにじみ px)",
      min: 4,
      max: 48,
      step: 1,
      default: 22,
      desc: "最も膨らんだ瞬間の光彩のぼかし半径。点なら12〜20px、カードなら20〜30pxが目安。大きくしすぎると周りの要素まで照らして主役がぼやける。",
    },
    {
      key: "scale",
      label: "scale(本体の膨らみ %)",
      min: 0,
      max: 20,
      step: 1,
      default: 6,
      desc: "本体がふくらむ割合。点は4〜8%、カードやボタンは0〜2%に抑える(大きな面が伸縮すると文字が揺れて読みにくい)。0なら光だけが呼吸する。",
    },
  ],
  promptTemplate: `ステータス表示(稼働中の点・おすすめプランのカード等)に breathing glow(呼吸する光)を実装してください。

- 本体の背後に、同じ形の擬似要素(::before)を置き、そこに box-shadow: 0 0 {{glow}}px をアクセント色で持たせる。光彩はこの層だけが担う
- 呼吸させるのは擬似要素の opacity(0.25 → 1 → 0.25)と、本体の transform: scale(吐き切りで 1、吸い切りで {{scale}}% 大きく)。box-shadow のぼかし値そのものはアニメーションさせない(毎フレーム再描画が走る)
- 1周期は {{period}}s の infinite ループ。@keyframes は 0%/100% を吐き切り、50% を吸い切りにして往復させる
- イージングは cubic-bezier(0.37, 0, 0.63, 1)(sine in-out)。ease-out 系だと頂点で「ピコッ」と当たって点滅に見える
- 画面内に複数ある場合は animation-delay を少しずつずらし、全部が同時に呼吸しないようにする
- 位置・サイズ(width/height)は動かさない。周りのレイアウトを揺らさない
- prefers-reduced-motion 時はループを止め、光彩を中間の強さ(opacity 0.6 程度)で静止表示する`,
  ngExample: {
    say: "「おすすめプランのカードをふわっと光らせて目立たせて」",
    why: "「ふわっと光らせる」だと、一度だけ光って止まるフェードや、box-shadow の値を直接アニメーションさせて毎フレーム再描画する重い実装が返ってきやすい。周期もイージングも決まらないので、速い点滅になると「エラー」「通知」のような緊急の意味に読まれる。",
  },
  okExample: {
    say: "「breathing glowを実装。::beforeにbox-shadow 22pxの光彩を持たせ、そのopacityを0.25↔1、本体をscale 1↔1.06で3.2s infinite。sine in-out。box-shadowは動かさない。reduced-motionは中間の光で静止」",
    why: "「光を持った層のopacityで呼吸させる」という実装方式と、周期・振れ幅・イージングまで指定している。box-shadow を動かさない一言で重さを防ぎ、sine in-out の指定で点滅ではなく呼吸に見せられる。",
  },
  vocab: [
    {
      term: "breathing(呼吸)",
      desc: "明るさや大きさを一定周期で滑らかに往復させる表現。スリープ中のMacのランプが元祖として知られ、「動作中だが急ぎではない」ことを伝える。",
    },
    {
      term: "sine in-out",
      desc: "正弦波に沿った加減速(cubic-bezier(0.37, 0, 0.63, 1))。両端でゆっくり止まって向きを変えるので、吸う・吐くの切り返しが自然に見える。",
    },
    {
      term: "pseudo-element glow",
      desc: "光彩を擬似要素に分けて持たせ、その opacity だけを動かす手法。box-shadow のぼかし値を直接アニメーションさせるより描画コストが低い。",
    },
    {
      term: "phase offset(位相ずらし)",
      desc: "同じ動きの開始タイミングを要素ごとにずらすこと。複数の点が一斉に明滅すると電飾に見えるので、少しずらして生き物らしさを出す。",
    },
  ],
  related: ["pulse-ring", "twinkle", "ambient-float"],
};
