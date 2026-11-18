import type { MotionEntry } from "@/lib/types";

export const rotateDevicePrompt: MotionEntry = {
  slug: "rotate-device-prompt",
  category: "ui",
  nameJa: "画面回転の促し（スマホがくるっと向きを変える）",
  nameEn: "rotate device prompt / orientation hint / turn your phone animation",
  lede: "縦向き専用（または横向き専用）のページを逆の向きで開いたとき、スマホの絵が90°くるっと回って「端末を回して」を文字より先に伝える案内。回す前に一拍待ち、回し終えた姿勢で少し大きく止まる、の緩急が「こっちが正解」を読ませる。",
  params: [
    {
      key: "direction",
      label: "direction(促す向き)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["to portrait", "to landscape"],
      desc: "to portrait＝横倒しの端末が起き上がる（縦専用サイトを横で開いた時）。to landscape＝立った端末が左へ倒れる（横長の作品・ゲーム）。",
    },
    {
      key: "duration",
      label: "duration(1周の時間 s)",
      min: 1.6,
      max: 5,
      step: 0.1,
      default: 2.8,
      desc: "待つ→回す→止まる→戻す で1周。2.2〜3sが読みやすい。2s未満は回っている途中しか目に入らない。",
    },
    {
      key: "hold",
      label: "hold(回し終えた姿勢で止まる割合 %)",
      min: 10,
      max: 45,
      step: 1,
      default: 26,
      desc: "1周のうち正解の向きで静止する長さ。20〜30%が目安。短いと往復運動に見え、どちらが正解か読めない。",
    },
    {
      key: "pop",
      label: "pop(回し終えた姿勢の拡大率)",
      min: 1,
      max: 1.12,
      step: 0.01,
      default: 1.04,
      desc: "回す前は 0.94 に縮めておき、正解の向きでこの倍率まで膨らませる。1.03〜1.06で「決まった」と読める。1なら縮んだまま回るだけ。",
    },
  ],
  promptTemplate: `スマホで想定と逆の向きに開かれたときだけ出る全画面のオーバーレイに、rotate device prompt(端末を回すよう促すアニメーション)を実装してください。

- きっかけ: matchMedia で向きを監視し、促す向き({{direction}})と逆の向きの間だけオーバーレイを表示して、操作不要で自動ループ再生する。向きが直ったら(change イベント)オーバーレイを opacity 0.36s で消し、ループも止める。デモでは「I've turned it」ボタンの click で同じ消え方をする
- 促す向きは {{direction}}(to portrait=rotate(-90deg)の横倒しから rotate(0deg) へ起こす / to landscape=rotate(0deg)から rotate(-90deg) へ左に倒す)
- 1周 {{duration}}s の無限ループ。正解の向きで静止する割合を {{hold}}% とし、残り(100−{{hold}})% を「最初の待ち 16% → 回す 40% → 戻す 28% → 最後の待ち 16%」に配分する({{hold}}=26 なら 0〜12% 待ち / 12→42% 回す / 42〜68% 静止 / 68→88% 戻す / 88〜100% 待ち)
- 各区間の補間は cubic-bezier(0.4, 0, 0.2, 1)。キーフレームの offset は {{hold}} から計算するので、WAAPI の element.animate を使い、easing はオプションではなく各キーフレームに書く(オプションに書くと1周全体に1本しか掛からない)
- 回す前の姿勢は scale(0.94)、回し終えた姿勢は scale({{pop}})。回転と拡大は同じ transform で同時に補間する
- 端末の横に曲がった矢印を添え、同じ時間割で 回す前=opacity 0.25・rotate(20deg)・scale(0.82) → 回し終えた姿勢=opacity 1・rotate(-18deg)・scale(1) に ease-in-out で動かす(to portrait のときは矢印を左右反転して時計回りを指させる)
- transform-origin は端末の中心。width/height を入れ替えず、transform: rotate だけで回す
- 端末は CSS の枠線(角丸の縦長の箱＋下端の小さな点)で描く。画像1枚に頼らない
- prefers-reduced-motion 時はループさせず、端末を回し終えた姿勢で静止させ、矢印を opacity 0.9 で添えて意味だけ残す`,
  ngExample: {
    say: "「横向きで開いたら『縦にしてください』って出して、スマホのアイコンを回して」",
    why: "回す区間と止まる区間の配分が無いので、0→90°を一定速度で往復し続けるだけの実装が返ってくる。どちらの向きが正解か読めず、ただ揺れているアイコンになる。width/height を入れ替えて回す重い実装も混ざる。",
  },
  okExample: {
    say: "「rotate device prompt を to portrait で。2.8s ループ、待ち12%→回す30%→rotate(0)・scale(1.04)で26%静止→戻す20%→待ち12%。各区間 cubic-bezier(0.4,0,0.2,1)、回す前は rotate(-90deg) scale(0.94)。矢印は opacity .25→1・rotate(20→-18deg)。向きが直ったら0.36sで消す。reduced-motionは正解の姿勢で静止」",
    why: "正解の向き・静止の割合・縮めてから膨らませる緩急・矢印の同期・消えるきっかけまで揃っている。特に「正解の向きで一番長く止まる」配分が、往復するだけのアイコンと「こっちに回して」と読めるアイコンを分ける。",
  },
  vocab: [
    {
      term: "orientation lock(画面向きの固定)",
      desc: "サイトやアプリを縦か横の一方だけで見せること。Webでは端末の回転を止められないので、逆の向きの間だけ覆いを出して回すよう頼む。",
    },
    {
      term: "matchMedia('(orientation: portrait)')",
      desc: "画面が縦長かどうかをJSで判定するメディアクエリ。change イベントで回した瞬間を拾える。CSSなら @media (orientation: landscape) で覆いを出し分けられる。",
    },
    {
      term: "静止の配分(hold)",
      desc: "ループの1周のうち、見せたい姿勢で止まっている時間の割合。動いている時間より止まっている時間のほうが、どちらが答えかを伝える。",
    },
    {
      term: "transform-origin: center",
      desc: "回転の中心。端末の真ん中を軸にすると、その場でくるっと向きが変わる。角を軸にすると倒れ込む動きになり、意味が変わる。",
    },
  ],
  titleAct: { act: "pendulum-swing", map: { angle: 30, pivot: 0, period: "duration", damping: 60 } },
  aliases: ["くるっと", "くるん", "縦にして", "横にして", "スマホを回して"],
  related: ["gesture-hint", "hint-nudge", "scroll-cue", "pendulum-swing"],
};
