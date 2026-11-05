import type { MotionEntry } from "@/lib/types";

export const paperPlaneSend: MotionEntry = {
  slug: "paper-plane-send",
  category: "ui",
  nameJa: "紙飛行機で送信（便箋を折って飛ばす）",
  nameEn: "paper plane send animation / fold into paper plane / send message animation",
  lede: "送信を押すと、書いた便箋が紙飛行機の形へ畳まれ、入れ替わった紙飛行機が斜め上へ傾きを深めながら遠ざかって点になる送信演出。畳み終わる少し前に紙飛行機を出して重ねるのが肝で、切れ目を作ると「消えて別の物が飛んだ」に見え、「書いたものがそのまま届けに行った」につながらない。",
  params: [
    {
      key: "foldDuration",
      label: "foldDuration(便箋が紙飛行機の形へ畳まれる時間 s)",
      min: 0.3,
      max: 1.5,
      step: 0.05,
      default: 0.75,
      desc: "0.6〜0.9sで「折った」と読める。ease-in で畳むので、0.4sを切ると畳む途中が見えずに縮んで消えるだけになり、1.2sを超えると送信の反応が鈍く感じる。",
    },
    {
      key: "launchDelay",
      label: "launchDelay(押してから紙飛行機が飛び出すまで s)",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.65,
      desc: "foldDuration より0.05〜0.15s短くして、畳み終わる直前に重ねるのが目安(既定 0.75s に対して 0.65s)。同じか長いと便箋が消えてから紙飛行機が出る「間」ができ、別の物に見える。",
    },
    {
      key: "flightDuration",
      label: "flightDuration(飛び立ってから見えなくなるまで s)",
      min: 0.8,
      max: 4,
      step: 0.1,
      default: 2.6,
      desc: "2〜3sで遠くへ飛んでいく余韻になる。出だしの速い減速カーブなので、1.2sを切ると弾き飛ばしたように見え、3.5sを超えると完了表示までが待ち時間になる。",
    },
    {
      key: "climb",
      label: "climb(飛び終わりの機首の上げ角 deg)",
      min: 20,
      max: 70,
      step: 1,
      default: 40,
      desc: "飛び出し時の傾き -20deg から、この角度まで機首を上げていく。35〜45degで上昇して遠ざかる。20だと傾きが変わらず滑っていくだけ、60を超えると宙返りしかける。",
    },
  ],
  promptTemplate: `お問い合わせフォームの送信に paper plane send animation(便箋を紙飛行機に畳んで飛ばす)を実装してください。

- きっかけ: 「Send letter」ボタンへの click / タップで1回再生する。再生中のクリックは無視する。飛び終わって 0.9s 後に新しい便箋を 0.4s で下から戻す。戻ってから 3s 何もされなければ自動で送る(無操作でも繰り返す。最初の表示のときだけ 6s 待つ)
- 便箋(縦長の紙・中央)を {{foldDuration}}s ease-in で畳む: transform を translate(-50%, -50%) rotate(0) → translate(-50%, -15%) rotate(-20deg) scale(0.45)、同時に clip-path を polygon(0 0, 100% 0, 100% 100%, 0 100%) → polygon(0 0, 100% 45%, 15% 100%, 30% 48%)(同じ4点のまま紙飛行機の輪郭へ寄せる)、opacity 1 → 0
- 押してから {{launchDelay}}s 遅れて、紙飛行機(幅95px × 高さ60px、clip-path: polygon(0 0, 100% 45%, 15% 100%, 30% 48%)、紙色の linear-gradient(140deg) で折り目の影を付ける)を便箋の下寄り(舞台の 左50%・上60%)から飛ばす
- 紙飛行機は {{flightDuration}}s cubic-bezier(0.2, 0.5, 0.5, 1) で、translate(-50%, 50%) rotate(-20deg) scale(1.8)・opacity 1 → translate(40cqw, -65cqh) rotate(-{{climb}}deg) scale(0.02)・opacity 0(舞台を container-type: size にして右上の奥へ。fill-mode は both)
- 全部 transform・clip-path・opacity だけで動かす(width / top を動かさない=リフロー禁止)
- 飛び終わりに合わせて「Sent」の小さな表示を出し、完了を言葉でも伝える
- prefers-reduced-motion 時は畳み・飛行・自動再生をすべて止め、押したら便箋を 0.2s の opacity だけで消して「Sent」を出す。もう一度押すと元に戻す`,
  ngExample: {
    say: "「送信ボタンを押したら紙飛行機が飛んでいく感じにして」",
    why: "「飛んでいく感じ」では何が紙飛行機になるのか決まらない。ボタンのアイコンだけが右へ滑って消えるか、便箋がフェードで消えた後に別の紙飛行機がまっすぐ横切る実装が返り、畳む過程と重ね合わせが抜けて「書いたものが飛んだ」に見えない。",
  },
  okExample: {
    say: "「paper plane sendで。便箋を0.75s ease-inでclip-pathの4点ポリゴンへ寄せて scale(0.45) rotate(-20deg) に畳み、0.65sで紙飛行機に入れ替えて2.6s cubic-bezier(0.2,0.5,0.5,1)でtranslate(40cqw,-65cqh) rotate(-40deg) scale(0.02)へ。transformのみ」",
    why: "便箋→紙飛行機の形の受け渡し(同じ4点のclip-path)と、畳み終わる0.1s前に重ねる時間差、遠ざかり方(縮小と機首上げ)を値で指定した。この3つで「折って、飛ばして、届いた」が1つの出来事になる。",
  },
  vocab: [
    {
      term: "clip-path: polygon()",
      desc: "多角形で要素を切り抜く指定。頂点の数が同じなら補間できるので、四角い便箋を4点のまま紙飛行機の輪郭へ畳める。",
    },
    {
      term: "overlap (handoff)",
      desc: "前の動きが終わる直前に次の動きを始めて重ねる組み方。便箋が消えきる前に紙飛行機を出すと、2つが同じ物に見える。",
    },
    {
      term: "scale to vanish",
      desc: "遠ざかる物を scale で点まで縮めて消す手法。奥行き(Z)を使わずに「遠くへ行った」を出せる。",
    },
    {
      term: "cqw / cqh",
      desc: "コンテナクエリ単位。container-type: size の要素の幅・高さに対する%。舞台の大きさに合わせて飛ぶ距離を決められる。",
    },
    {
      term: "ease-out (減速)",
      desc: "出だしが速く終わりがゆっくりのイージング。投げた紙飛行機の勢いが抜けていく様子。ここでは cubic-bezier(0.2, 0.5, 0.5, 1)。",
    },
  ],
  titleAct: { act: "paper-crumple", map: { duration: "foldDuration", ball: 0.12, wrinkle: 0, toss: "climb*6" } },
  aliases: ["紙飛行機", "スーッ", "ヒューン", "送信", "折って飛ばす"],
  related: ["paper-crumple", "stateful-button", "fly-to-cart", "fold-transition"],
};
