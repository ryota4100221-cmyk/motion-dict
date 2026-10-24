import type { MotionEntry } from "@/lib/types";

export const scratchCard: MotionEntry = {
  slug: "scratch-card",
  category: "ui",
  nameJa: "スクラッチカード（削って当たりを出す）",
  nameEn: "scratch card / scratch to reveal / scratch-off reveal",
  lede: "銀色の膜を指やカーソルで擦ると、擦った跡だけが透けて下の当たりが覗く演出。跡が消えずに積み重なることと、ある程度削れたら残りを自動で剥がす「打ち切りの閾値」が要で、ここが無いと最後の数ピクセルを探して擦り続けることになる。",
  params: [
    {
      key: "brush",
      label: "brush(削る線の太さ px)",
      min: 12,
      max: 64,
      step: 2,
      default: 32,
      desc: "カード幅の1/8〜1/6が目安（atomato.co は幅140に対して24）。細すぎると何往復も要って面倒になり、太すぎると一撫でで終わって「削る」手応えが消える。",
    },
    {
      key: "threshold",
      label: "threshold(自動で全開にする削れ率 %)",
      min: 20,
      max: 95,
      step: 5,
      default: 55,
      desc: "50〜60%が定番。中身が読めた時点で剥がすのが親切で、80%を超えると隅を探して擦る作業になる。30%以下だと削った実感の前に終わる。",
    },
    {
      key: "fade",
      label: "fade(残りの膜が消える時間 s)",
      min: 0.1,
      max: 1.2,
      step: 0.05,
      default: 0.4,
      desc: "0.3〜0.5sが自然。閾値を超えた瞬間に消すと「勝手に消えた」に見えるので、短いフェードで「剥がれた」と読ませる。",
    },
  ],
  promptTemplate: `クーポン表示に scratch card(scratch to reveal)を実装してください。

- きっかけ: カード上のどこでも押したまま動かす(マウスはドラッグ、タッチは指でなぞる)と、その軌跡だけ膜が削れる。押した点にも1点ぶん穴を開ける
- 当たりの中身(コードや割引率)は普通のHTMLで下に置き、その上に同じ大きさの canvas を重ねて銀色の膜を描く(グラデーション＋「SCRATCH TO REVEAL」の文字)。canvas は devicePixelRatio を掛けた解像度で確保する
- pointerdown〜pointermove の間、前回の点から今回の点まで線を引いて膜を消す。ctx.globalCompositeOperation = "destination-out"、lineWidth は {{brush}}px、lineCap / lineJoin は round。点だけ打つと速く動かしたときに破線になるので、必ず線でつなぐ
- 消した跡は消さずに積み重ねる(毎フレーム描き直さない)。setPointerCapture でカードの外へはみ出しても線が途切れないようにし、canvas には touch-action: none を付けてスマホでページがスクロールしないようにする
- 削れ率は getImageData で数フレームおきに間引いて測り(全画素を毎回数えない)、透明な画素の割合が {{threshold}}% を超えたら残りの膜を opacity で {{fade}}s の ease-out をかけて消し、canvas の pointer-events を切る。同時に下の中身を transform: scale(1.04) へ 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) で少しだけ弾ませる
- 描画はイベントハンドラではなく requestAnimationFrame 内でまとめて行う。イベントでは座標を溜めるだけにする
- 結果は aria-live="polite" で読み上げ、キーボードやスクリーンリーダーの利用者向けに「削らずに表示」ボタンを別に置く(削る操作だけを唯一の手段にしない)
- prefers-reduced-motion 時は自動のデモ再生(コインが擦る演出)をせず、閾値を超えたらフェードなしで即座に膜を消す`,
  ngExample: {
    say: "「スクラッチカードみたいに、こすったら下が見えるようにして」",
    why: "カーソル位置に穴を開けるだけで跡が残らない（離すと元に戻る）実装や、mousemove の点ごとに円を打って速く動かすと点線になる実装が返りがち。いつ全部剥がすかが決まらないので、最後の数ピクセルまで擦らせる仕様になりやすく、スマホでは擦るたびにページがスクロールする。",
  },
  okExample: {
    say: "「scratch card を canvas の destination-out で。線幅32px・round で前回の点から線をつなぎ、跡は累積。削れ率を getImageData で間引いて測り、55%を超えたら残りを0.4sでフェード。touch-action: none＋pointer capture、reduced-motion は即時に消す。削らず見るボタンも置く」",
    why: "消し方（destination-out で累積）、線のつなぎ方、打ち切りの閾値と消え方、タッチの扱いまで指定。「閾値で残りを剥がす」の一言で、遊びとしての手応えと、中身にたどり着くまでの手間の上限が両立する。",
  },
  vocab: [
    {
      term: "scratch card / scratch-off",
      desc: "銀色の膜を削って当たりを見る宝くじ・クーポンの形式。Webではメール登録の見返りやキャンペーンの抽選演出として、spin to win と並ぶゲーミフィケーションの定番。",
    },
    {
      term: "destination-out",
      desc: "canvas の合成モードの1つ。これから描く図形の形に、既に描かれている内容を透明にくり抜く。消しゴムを作るときの決まり文句。",
    },
    {
      term: "削れ率（reveal threshold）",
      desc: "膜のうち透明になった画素の割合。これが一定を超えたら残りを自動で剥がす。全画素を毎フレーム数えると重いので、画素を飛ばして数え、数フレームに1回だけ測る。",
    },
    {
      term: "線補間（stroke interpolation）",
      desc: "pointermove は一定間隔でしか届かないため、点ごとに円を打つと速い操作で跡が途切れる。前回の点と今回の点を lineTo でつないで隙間を埋める。",
    },
    {
      term: "pointer capture",
      desc: "setPointerCapture で、押した要素に以後のポインタイベントを送り続けさせる指定。カードの外へはみ出して戻っても線が切れない。",
    },
  ],
  related: ["prize-wheel", "xray-lens", "confetti-burst", "line-draw"],
};
