import type { MotionEntry } from "@/lib/types";

export const lineBoil: MotionEntry = {
  slug: "line-boil",
  category: "hover",
  nameJa: "ボイル（コマ撮り風の震え）",
  nameEn: "line boil / boiling lines / stop-motion jitter / hand-drawn wiggle",
  lede: "線や文字が数フレームごとにカクッと位置と角度を変え、手描きアニメやコマ撮りのように「ふつふつ沸いて」見える震え。滑らかに補間せず steps() で数枚の姿勢を切り替えるのが要で、静止画のUIに手仕事の温度とアナログ感を足せる。",
  params: [
    {
      key: "fps",
      label: "fps(1秒あたりの姿勢の切り替え回数)",
      min: 4,
      max: 24,
      step: 1,
      default: 10,
      desc: "8〜12がコマ撮りらしい粗さ(12がアニメの「2コマ打ち」)。16を超えると震えではなく振動に見え、手描き感が消える。",
    },
    {
      key: "amplitude",
      label: "amplitude(位置のずれ px)",
      min: 0.2,
      max: 4,
      step: 0.1,
      default: 1.4,
      desc: "姿勢ごとに動く最大距離。ボタンや文字は1〜1.5pxで「生きている」程度、3pxを超えると揺れが主役になり読みにくい。",
    },
    {
      key: "rotation",
      label: "rotation(角度のずれ deg)",
      min: 0,
      max: 4,
      step: 0.1,
      default: 1,
      desc: "姿勢ごとの傾き。1deg前後で線が描き直されたように見える。0にすると平行移動だけの機械的な震えになる。",
    },
  ],
  promptTemplate: `要素に line boil(コマ撮り風の震え)を実装してください。

- 姿勢を4枚用意した @keyframes を作り、0% / 25% / 50% / 75% にそれぞれ別の translate と rotate を置く(100% は 0% と同じ)
- 各姿勢のずれは位置 最大{{amplitude}}px・角度 最大{{rotation}}deg。符号と大きさを姿勢ごとにばらし、往復運動に見えないようにする
- タイミング関数は steps(1) または step-end。ease や linear で補間すると「揺れ」になってしまい、コマ撮りの粗さが出ない
- 1秒に {{fps}} 回姿勢を切り替える。4姿勢なので animation-duration は 4 / {{fps}} 秒、infinite で回す
- 背景の板と文字のように層が重なる場合は、層ごとに duration か animation-direction(reverse)を変えて同期させない
- ボタンでは :hover と :focus-visible のときだけ再生し、常時再生はアイコン等の小さな装飾に限る
- 動かすのは transform のみ(レイアウトを動かさない)
- prefers-reduced-motion 時は animation を止め、静止した1枚の姿勢で表示する`,
  ngExample: {
    say: "「ホバーしたらボタンを手描きっぽくぷるぷるさせて」",
    why: "「ぷるぷる」だと ease-in-out の滑らかな往復(=error shake や wiggle)が返ってくる。補間せずに姿勢を切り替える、という一番大事な点が伝わらず、手描きではなくただの振動になる。",
  },
  okExample: {
    say: "「line boilをhover時に。@keyframesに4姿勢(最大1.4px・1deg)、steps(1)で10fps=0.4s infinite。板と文字は別周期でずらす。transformのみ、reduced-motionで停止」",
    why: "「steps(1)で補間しない」「姿勢の数とfps」「層をずらす」を指定している。この3つが揃って初めて、滑らかな揺れではなくコマ撮りの粗さになる。",
  },
  vocab: [
    {
      term: "boil(ボイル)",
      desc: "手描きアニメで、止まっている絵も毎コマ描き直すため線が沸き立つように揺れる現象。これをあえて演出として再現する。",
    },
    {
      term: "steps(1) / step-end",
      desc: "キーフレーム間を補間せず、次のキーフレームまで値を保持するタイミング関数。姿勢を「切り替える」ための必須指定。",
    },
    {
      term: "2コマ打ち(on twos)",
      desc: "24fpsの映像で同じ絵を2コマずつ使う、つまり実質12fps。コマ撮り・手描きの標準的な粗さで、fpsの目安になる。",
    },
    {
      term: "層のずらし(desync)",
      desc: "板と文字など重なった要素を別周期・逆再生で震わせること。同じ周期だと1枚の画像が揺れているだけに見える。",
    },
  ],
  related: ["sprite-sheet", "error-shake", "hint-nudge"],
};
