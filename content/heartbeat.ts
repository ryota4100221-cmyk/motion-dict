import type { MotionEntry } from "@/lib/types";

export const heartbeat: MotionEntry = {
  slug: "heartbeat",
  category: "ui",
  nameJa: "ハートビート（ドクンドクンと打つ鼓動）",
  nameEn: "heartbeat animation / heart beat pulse / lub-dub pulse",
  lede: "ハートやいいねの印が「ドクン、ドクン」と2回続けて膨らみ、少し休んでまた打つ鼓動のループ。正弦波で行き来する呼吸と違い、強い1拍目・弱い2拍目・休みの3つで1周期を組むので、同じ拡大縮小でも「生きている」「好き」がはっきり伝わる。",
  params: [
    {
      key: "duration",
      label: "duration(1拍の周期 s)",
      min: 0.4,
      max: 2,
      step: 0.01,
      default: 0.92,
      desc: "ドクン・ドクン・休みの1周の秒数。0.8〜1.0s(毎分60〜75拍)が安静時の心拍に近い。0.6sを切ると動悸や警告に見え、1.5sを超えると2拍が離れて別々の弾みに見える。",
    },
    {
      key: "peak",
      label: "peak(1拍目の膨らみ %)",
      min: 5,
      max: 50,
      step: 1,
      default: 34,
      desc: "1拍目で最も大きくなる割合。16px前後のアイコンなら25〜35%、大きなハートやボタンは8〜15%に抑える(面が大きいほど少しの拡大でも強く見える)。",
    },
    {
      key: "echo",
      label: "echo(2拍目の強さ 1拍目比 %)",
      min: 0,
      max: 100,
      step: 1,
      default: 53,
      desc: "2拍目の膨らみを1拍目の何%にするか。40〜60%で「ドクン、ドクッ」と心音らしくなる。100%だと同じ弾みが2回続くだけ、0%だと1拍だけの脈になる。",
    },
    {
      key: "stagger",
      label: "stagger(隣の印との拍のずれ ms)",
      min: 0,
      max: 200,
      step: 5,
      default: 55,
      desc: "並んだ印の拍を何msずつ遅らせるか。40〜80msで左から右へ鼓動が伝わって見える。0にすると全部が同時に打ち、点滅に近くなる。",
    },
  ],
  promptTemplate: `評価欄やお気に入りのハートアイコンに heartbeat(ドクンドクンと打つ鼓動)を実装してください。

- きっかけ: 大きなハートは表示した時点から自動で打ち続ける無限ループ(操作不要)。下の5つ並んだ評価の星は、行にポインタが入る(スマホはタップで切り替え)と星がハートに変わって順に打ち始め、ポインタが出る(再タップ)と星に戻る
- 1周期は {{duration}}s の infinite ループ。@keyframes を 0% / 16% / 32% / 48% / 74% / 100% の6点で組む
  - 0% と 74%〜100%: transform: scale(1)(74%以降は休み)
  - 16%: 1拍目。scale(1 + {{peak}}%)
  - 32%: 反動。1 − {{peak}}% × 0.35 まで少し縮む(1拍目の跳ね返り)
  - 48%: 2拍目。1拍目の {{echo}}% の膨らみ = scale(1 + {{peak}}% × {{echo}}%)
- animation-timing-function は ease-in-out。各区間ごとに掛かるので、毎拍の頭と頂点で滑らかに切り返す。正弦波1本や linear にしない(呼吸や機械的な点滅に見える)
- 拍に合わせて filter: drop-shadow(0 0 7px アクセント色 55%)を1拍目で最大、2拍目で 45% / 5px、休みで 0 にし、光も一緒に打たせる
- 並んだ5つは animation-delay を左から {{stagger}}ms ずつ遅らせ、鼓動が左から右へ伝わるようにする
- 星からハートに変わる瞬間は、ハートを scale(0.25)・opacity 0 から 360ms・cubic-bezier(0.34, 1.56, 0.64, 1)(少し行き過ぎて戻る)で出し、出る順も左から 42ms ずつずらす(拍のアニメーションとは別の親要素に掛け、transform を取り合わせない)
- transform-origin は中央。動かすのは transform と filter だけで、width/height やマージンは変えない(並びを揺らさない)
- prefers-reduced-motion 時は拍のループを止め、ハートを scale(1)・光なしで静止表示する(星→ハートの切り替え自体は残す)`,
  ngExample: {
    say: "「ハートをドキドキさせて目立たせて」",
    why: "「ドキドキ」だと、scale を 1↔1.1 で正弦波に往復させるだけの呼吸のようなループが返ってきやすい。2拍と休みの区切りが無いので心臓には見えず、周期も決まらないため速すぎて警告の点滅に読まれたり、遅すぎて揺れているだけに見えたりする。",
  },
  okExample: {
    say: "「heartbeatを実装。0.92s infinite、keyframesは16%でscale 1.34・32%で0.88・48%で1.18・74%以降1で休み、ease-in-out。drop-shadowも拍に合わせる。並んだ5つは55msずつ遅らせる。reduced-motionは静止」",
    why: "1拍目・反動・2拍目・休みの位置と大きさをkeyframesの%で指定しているので、呼吸ではなく「ドクン、ドクッ」の心音になる。周期を心拍の範囲に置き、ずれをmsで書いているので並べても点滅にならない。",
  },
  vocab: [
    {
      term: "lub-dub(心音の2拍)",
      desc: "心臓の弁が閉じる音の「ドクン(lub)、ドクッ(dub)」。強い1拍目と弱い2拍目が短く続き、その後に休みが来る。heartbeatアニメーションはこの非対称なリズムを scale で写す。",
    },
    {
      term: "rest phase(休み)",
      desc: "1周期の後半(ここでは74%以降)に置く、何も動かない区間。休みがあることで2拍がひとまとまりに聞こえ、連続した振動ではなく鼓動に見える。",
    },
    {
      term: "recoil(反動)",
      desc: "1拍目の直後に元の大きさより少し縮むこと。跳ね返りが入ると膨らみに弾力が出て、ゴムのように生きた質感になる。",
    },
    {
      term: "per-segment easing(区間ごとのイージング)",
      desc: "CSSの animation-timing-function は keyframes の隣り合う2点の間それぞれに掛かる。拍ごとに加減速をやり直せるので、1本の正弦波では作れない「打って止まる」動きになる。",
    },
  ],
  titleAct: { act: "breathing-glow", map: { period: "duration", scale: "peak", glow: 14 } },
  aliases: ["ドクンドクン", "ドキドキ", "心拍", "鼓動", "ハートが脈打つ"],
  related: ["breathing-glow", "pulse-ring", "like-burst"],
};
