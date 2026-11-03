import type { MotionEntry } from "@/lib/types";

export const ticketTear: MotionEntry = {
  slug: "ticket-tear",
  category: "ui",
  nameJa: "半券もぎり",
  nameEn: "ticket stub tear-off / ticket punch / perforated tear-off",
  lede: "押したチケットに穴が開き、ミシン目から半券がちぎれて傾きながら落ち、残った本体が手前へ持ち上がる演出。穴→半券→本体を数百msずつずらして重ねるのが肝で、同時に動かすと「消えた」にしか見えず「もぎって受け取った」手触りが出ない。",
  params: [
    {
      key: "tearDelay",
      label: "tearDelay(穴が開いてから半券が外れるまで s)",
      min: 0,
      max: 0.8,
      step: 0.02,
      default: 0.32,
      desc: "0.25〜0.4sで「パチン→ビリッ」の2拍に分かれて読める。0だと穴と半券が同時に動いて穴が見えず、0.6sを超えると押してから反応が鈍く感じる。",
    },
    {
      key: "tearDuration",
      label: "tearDuration(半券が落ちきる時間 s)",
      min: 0.4,
      max: 2,
      step: 0.05,
      default: 1,
      desc: "0.8〜1.2sが紙の落ち方。ease-in で加速するので、0.5sを切ると落下ではなく弾き飛ばしに見え、1.5sを超えると宙を漂う。",
    },
    {
      key: "tearAngle",
      label: "tearAngle(落ちながら回る角度 deg)",
      min: 0,
      max: 90,
      step: 1,
      default: 36,
      desc: "落ちきるまでに半券が回る量。30〜45degで「ちぎれて片側から外れた」と読める。0だと切り離しが真下へ滑るだけになり、70degを超えるとひらひら舞う紙吹雪寄りになる。",
    },
    {
      key: "lift",
      label: "lift(残った本体を持ち上げる倍率)",
      min: 1,
      max: 1.5,
      step: 0.01,
      default: 1.25,
      desc: "半券の後に本体が手前へ寄る大きさ。1.15〜1.3で「受け取った」になる。1.0だと半券が落ちるだけで次の画面への橋渡しにならず、1.4を超えると舞台からはみ出す。",
    },
  ],
  promptTemplate: `イベントの入場チケット(本体＋右端の半券)に ticket stub tear-off(半券もぎり)を実装してください。

- きっかけ: チケット全体(button 要素)への click / タップで1回再生する。再生中のクリックは無視する。もぎり終わって 0.9s 後に新しいチケットを上から発券し直す。発券から 3s 何もされなければ自動でもぎる(無操作でも繰り返す。最初の表示のときだけ 6s 待つ)
- チケットは本体と半券(幅23%)を横に並べ、境目の上下に半径11pxの切り欠き(mask: radial-gradient)、境目にミシン目の点線を付ける
- 押したら半券の上寄り(上から14%)に直径14pxの穴を transform: scale(0→1) で 0.12s ease-out で開ける
- 同時に50ms遅れて、穴の形の紙片(同じ大きさの円)を translate(40%, 900%) rotate(200deg) scaleX(0.4) まで 0.9s cubic-bezier(0.4, 0, 1, 1) で落とす(80%までは opacity 1、最後の20%で消す)
- {{tearDelay}}s 遅れて、半券を {{tearDuration}}s cubic-bezier(0.5, 0, 0.9, 0.5) で外す。キーフレームは 12% で translate(4%, -3%) rotate({{tearAngle}}deg の 1/9)(ちぎる瞬間に少し持ち上がる)、100% で translate(60%, 260%) rotate({{tearAngle}}deg)・opacity 0
- さらに 0.13s 遅れて(= {{tearDelay}}s + 0.13s)、残った本体を 1.1s cubic-bezier(0.3, 0, 0.2, 1) で translateY(-30%) scale({{lift}}) rotate(3deg) へ持ち上げる
- 発券し直しは 0.95s cubic-bezier(0.2, 1.25, 0.4, 1) で、translateY(-60%) scale(0.3, 0.05)・opacity 0 → 12% で scale(0.32, 0.3)・opacity 1 → 元の状態(細い紙が口から出て広がる)
- 全部 transform と opacity だけで動かす(width / top を動かさない=リフロー禁止)。fill-mode は forwards
- prefers-reduced-motion 時は落下・持ち上げ・自動再生をすべて止め、押したら穴を表示して半券を 0.2s の opacity だけで消す。もう一度押すと元に戻す`,
  ngExample: {
    say: "「ボタンを押したらチケットがビリッと破れる感じにして」",
    why: "「ビリッと」では何がどこから破れるのか決まらない。チケット全体がフェードアウトするだけか、全体を左右に割る(＝torn paper reveal)実装が返り、穴開け→半券の落下→本体の持ち上げの時間差が抜けて「もぎって受け取った」に見えない。",
  },
  okExample: {
    say: "「ticket stub tear-offで。穴をscale 0→1の0.12s、0.32s遅れで半券を1s ease-inでtranslate(60%,260%) rotate(36deg)へ落とし、0.45s遅れで本体をscale(1.25)へ持ち上げる。transformのみ」",
    why: "3つの部品(穴・半券・本体)の順番と遅延、落ち方のイージングと最終位置を値で指定した。時間差が「パチン→ビリッ→受け取る」の3拍を作る。",
  },
  vocab: [
    {
      term: "perforation",
      desc: "ミシン目。半券の境目に並べた点線。radial-gradient を repeat-y で敷くと画像なしで描ける。",
    },
    {
      term: "mask: radial-gradient",
      desc: "円形の透明部分で要素を抜く指定。チケットの境目の上下の切り欠き(ノッチ)に使う。",
    },
    {
      term: "chad",
      desc: "穴を開けたときに抜け落ちる紙片。穴と別要素にして落とすと「穴を開けた」が一目で伝わる。",
    },
    {
      term: "staggered sequence",
      desc: "複数の部品の開始を少しずつずらして1つの出来事に見せる組み方。ここでは穴→紙片→半券→本体。",
    },
    {
      term: "ease-in (加速)",
      desc: "始めゆっくり終わり速いイージング。重力で落ちる物に使う。半券は cubic-bezier(0.5, 0, 0.9, 0.5)。",
    },
  ],
  titleAct: { act: "swipe-dismiss", map: { flyout: "tearDuration*0.3", snapBack: 0.4, threshold: 45, fling: "tearAngle*10" } },
  aliases: ["ビリッ", "パチン", "チケット", "もぎる", "切り取り線"],
  related: ["torn-paper-reveal", "swipe-dismiss", "sticker-peel"],
};
