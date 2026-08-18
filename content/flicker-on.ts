import type { MotionEntry } from "@/lib/types";

export const flickerOn: MotionEntry = {
  slug: "flicker-on",
  category: "ui",
  nameJa: "フリッカー点灯",
  nameEn: "flicker on / neon sign flicker / power-on flicker",
  lede: "消えていた看板やロゴが数回スタッターしてから点きっぱなしになる、蛍光灯・ネオンの点灯演出。opacityをsteps()で刻んで中間のフェードを一切作らないことと、明滅の落ち込みを回ごとに浅くして収束させることの2点で「電圧が安定していく」因果が画に出る。",
  params: [
    {
      key: "duration",
      label: "duration(点灯し切るまで s)",
      min: 0.3,
      max: 2.5,
      step: 0.05,
      default: 1,
      desc: "0.8〜1.2sが看板らしい。0.5s未満は事故のような一瞬になり、2sを超えると「壊れている」印象に振れる。",
    },
    {
      key: "flickers",
      label: "flickers(ちらつく回数)",
      min: 2,
      max: 10,
      step: 1,
      default: 5,
      desc: "点きかけて落ちる回数。4〜6回が実物らしい。2回だと単なる二度点きで、8回超はdurationを伸ばさないと1回が短すぎて滲む。",
    },
    {
      key: "dim",
      label: "dim(落ち込みの深さ opacity)",
      min: 0,
      max: 0.7,
      step: 0.05,
      default: 0.15,
      desc: "最初の落ち込みで沈む明るさ。0〜0.2が「一度消える」感触。0.4以上だと消えきらず、明滅ではなく明るさの揺れに見える。",
    },
    {
      key: "glow",
      label: "glow(発光の滲み px)",
      min: 0,
      max: 40,
      step: 2,
      default: 18,
      desc: "text-shadowのぼかし半径。文字サイズの4〜5割が目安。0で発光なしの蛍光灯、30px超はネオン管というより光害になる。",
    },
  ],
  promptTemplate: `見出し(または看板・ロゴ)に flicker on(ネオン/蛍光灯の点灯)を実装してください。

- 要素は opacity: 0 から始め、{{duration}}s かけて opacity: 1 へ点灯し切る。点灯後は点いたまま止める(往復・ループさせない)
- 途中で {{flickers}} 回スタッターさせる。落ち込み時の opacity は {{dim}} を最も深い値とし、回を追うごとに浅くする
- 明滅の切り替えは steps(1, end) で行い、中間の半透明を作らない(linear補間にするとフェードになりネオンに見えない)
- 各区間の長さは不等間隔にし、後半ほど短くして収束させる
- 発光は text-shadow の多重掛けで作る。白の芯 + 発光色のぼかし {{glow}}px + その2倍の広いぼかしの3枚
- 動かすのは opacity だけにする(box-shadow や filter のぼかし半径をアニメーションさせると再描画が重い)
- prefers-reduced-motion 時は明滅させず、0.2s のフェードインだけで点灯した状態にする`,
  ngExample: {
    say: "「ネオンっぽくチカチカさせて」",
    why: "「チカチカ」は等間隔の点滅と解釈され、opacityをlinearで往復させる実装が返ってくる。それは電飾の点滅サインであって「点きかけの蛍光灯」ではない。回数・落ち込みの深さ・不規則さ・最後に点いたまま止まること、どれも決まらない。",
  },
  okExample: {
    say: "「flicker onを実装。opacityを steps(1, end) で5回スタッターさせ、落ち込みは0.15から回ごとに浅く、1.0sで点灯し切って以降は点いたまま。発光はtext-shadow 3枚重ね(白の芯＋ライムの滲み18px＋その倍のぼかし)。動かすのはopacityのみ」",
    why: "段階的(steps)であること・回数と収束・最後は点いたまま止まること・発光の作り方まで指定している。特に「steps」と「点いたまま止める」の2語が、フェード往復という誤実装を確実に排除する。",
  },
  vocab: [
    {
      term: "steps()",
      desc: "補間を刻んで値を飛ばすイージング関数。中間の半透明を作らないので「パチッ」と点く。linearにすると同じ数値でもフェードになる。",
    },
    {
      term: "fill(animation-fill-mode)",
      desc: "再生前後の値を保持する指定。bothにしないと点灯し切った直後に元のopacity: 0へ戻ってしまう。",
    },
    {
      term: "text-shadowの多重掛け",
      desc: "ぼかし半径と色を変えたtext-shadowを重ねる技法。白の芯と色の滲みが分かれて初めて「発光している管」に見える。",
    },
    {
      term: "減衰する不規則性",
      desc: "明滅の間隔と落ち込みを回ごとに短く・浅くしていく設計。等間隔だと点滅サインになり、収束させると「電圧が安定していく」物理に読める。",
    },
  ],
  related: ["crt-power-off", "scanlines", "glitch-hover"],
};
