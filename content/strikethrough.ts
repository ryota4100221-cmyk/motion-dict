import type { MotionEntry } from "@/lib/types";

export const strikethrough: MotionEntry = {
  slug: "strikethrough",
  category: "text",
  nameJa: "取り消し線",
  nameEn: "animated strikethrough / strike-through text / cross-out animation",
  lede: "文字の中ほどに線が左からシュッと引かれ、引けた行がすっと沈む演出。「ボツ案を消して本命を残す」流れを1行ずつ見せられるので、言い直し・値下げ・やることリストの完了を、説明なしで伝えられる。",
  params: [
    {
      key: "duration",
      label: "duration(線を引く時間 s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.5,
      desc: "0.4〜0.6sで「ペンで消した」速さ。0.3s以下は打ち消しの意味が読めず、1sを超えると迷っているように見える。",
    },
    {
      key: "stagger",
      label: "stagger(行と行の間隔 s)",
      min: 0.2,
      max: 1.2,
      step: 0.05,
      default: 0.55,
      desc: "次の行が出て消されるまでの間。0.5s前後で1行ずつ読める。0.3s以下だと全部まとめて消えたように見える。",
    },
    {
      key: "dim",
      label: "dim(消した行の濃さ opacity)",
      min: 0.1,
      max: 1,
      step: 0.02,
      default: 0.46,
      desc: "線を引いた後に沈める先。0.4〜0.5で「読めるけれど退いた」状態。1にすると沈めない(線だけ)。",
    },
    {
      key: "thickness",
      label: "thickness(線の太さ %)",
      min: 3,
      max: 15,
      step: 1,
      default: 6,
      desc: "文字サイズに対する割合。5〜7%が活字の横線に近い。10%を超えるとマーカーや伏せ字に見えてくる。",
    },
  ],
  promptTemplate: `案を順に消していく見出しに animated strikethrough を実装してください。

- きっかけ: 表示した時点で自動で1回再生する(行が下から順に出て、消す行だけに線が引かれる)。最後の行は消さずに残す。「Strike again」ボタンを押すと最初からやり直す。繰り返しはこのボタンだけ
- 行は {{stagger}}s 間隔で順に、translateY(0.35em)→0 と opacity 0→1 を 0.7s cubic-bezier(0.16, 1, 0.3, 1) で出す
- 消す行の文字を span で包み、background-image: linear-gradient(currentColor, currentColor) を background-position: 0 57% / background-repeat: no-repeat で敷く
- 線は background-size を 0% {{thickness}}% → 100% {{thickness}}% (高さは font-size の {{thickness}}%、最低2px)に {{duration}}s の cubic-bezier(0.7, 0, 0.2, 1) で伸ばす。行が出てから0.55s後に引き始める
- 線が8割ほど引けた時点から、その行の文字と線を opacity 1 → {{dim}} に 0.5s ease で沈める。番号や注記などの添え字は少し濃いまま残す
- span に box-decoration-break: clone を付け、行をまたいでも折り返した各行に線が付くようにする
- text-decoration: line-through のフェードや width アニメーションではなく、background-size だけを動かす(リフローさせない)
- prefers-reduced-motion 時はアニメーションなしで、線が引かれ沈んだ最終状態を最初から表示する`,
  ngExample: {
    say: "「ボツ案に取り消し線を引くアニメーションを付けて」",
    why: "text-decoration: line-through をフェードで出すだけの実装が多く、線が「引かれる」動きが入らない。行の順番・線の高さ・消した後の扱いが決まらないので、全行が同時にパッと消され、どれが本命か読めない。",
  },
  okExample: {
    say: "「strikethroughを実装。行を0.55s間隔で下から出し、消す行は文字の57%の高さに太さ6%の線をbackground-sizeで0%→100%、0.5s cubic-bezier(.7,0,.2,1)。引けたら文字を0.46まで沈め、最後の行だけ残す。reduced-motion時は最終状態」",
    why: "線の作り方(background-size)と高さ・太さ・緩急、消した後に沈める濃さまで指定。「最後の行だけ残す」と書くことで、打ち消しが本命を立てる演出になる。",
  },
  vocab: [
    {
      term: "line-through",
      desc: "text-decorationの取り消し線。位置と太さを細かく決められずアニメーションもできないので、動かす線はbackgroundで作る。",
    },
    {
      term: "background-size",
      desc: "背景の描画サイズ。単色のgradientを横0%→100%に伸ばすと線が左から引かれる。transitionでき、リフローも走らない。",
    },
    {
      term: "box-decoration-break: clone",
      desc: "インライン要素が折り返したとき、背景を各行に複製する指定。長い文でも行ごとに線が端から端まで付く。",
    },
    {
      term: "dim (沈める)",
      desc: "消した要素の不透明度を下げて背景へ退かせること。線だけより「もう使わない」が一目で伝わり、残った行が立つ。",
    },
  ],
  titleAct: { act: "marker-line", map: { duration: "duration", thickness: "thickness" } },
  aliases: ["取り消し", "打ち消し線", "ボツ", "シュッ", "線で消す"],
  related: ["marker-line", "underline-reveal", "line-draw"],
};
