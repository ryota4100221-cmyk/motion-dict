import type { MotionEntry } from "@/lib/types";

export const beforeAfter: MotionEntry = {
  slug: "before-after",
  category: "media",
  nameJa: "ビフォーアフター",
  nameEn: "before after slider / image comparison",
  lede: "1本のハンドルをドラッグして2枚の画像を見比べるスライダー。レタッチ前後・施工前後など「差分そのもの」が価値のとき最も雄弁なUI。上の画像をclip-path: inset()で切り抜き、ハンドルはtransformで動かすのが定石。",
  params: [
    {
      key: "initial",
      label: "initial(初期位置 %)",
      min: 10,
      max: 90,
      step: 5,
      default: 50,
      desc: "読み込み時のハンドル位置。50で半々。afterを主役にするなら30前後でafter側を広く見せる。",
    },
    {
      key: "follow",
      label: "follow(追従の時間 s)",
      min: 0,
      max: 0.5,
      step: 0.05,
      default: 0.15,
      desc: "ドラッグ位置にハンドルが追いつくまでの時間。0で即時、0.1〜0.2sだと指に吸い付く柔らかさが出る。",
    },
  ],
  promptTemplate: `2枚の画像を比較する before/after スライダーを実装してください。

- after画像を下、before画像を上に同サイズで重ね、上の画像を clip-path: inset(0 右側% 0 0) で左側だけ見せる
- ハンドル(縦線+ツマミ)は left ではなく transform: translateX で動かす(リフロー禁止)
- Pointer Events(pointerdown/move/up)で実装し、setPointerCaptureで枠外に出てもドラッグを継続する
- コンテナに touch-action: none を指定し、スマホのスクロールと競合させない
- 初期位置は {{initial}}%
- clip-pathとハンドルの transform に {{follow}}s ease-out の transition をかけ、指をやわらかく追従させる
- prefers-reduced-motion 時は追従のtransitionを0sにして即時反映する`,
  ngExample: {
    say: "「画像をビフォーアフターで比較できるようにして」",
    why: "マスク方式もドラッグ挙動も未定義。widthを直接縮めて画像が潰れる実装や、mousemoveのみでスマホで動かない・スクロールと喧嘩する実装が返ってきがち。",
  },
  okExample: {
    say: "「before/afterスライダーを実装。2枚重ねて上をclip-path: inset()で切り、ハンドルはtranslateX。Pointer Events+setPointerCapture、touch-action: none。初期位置50%、追従0.15s ease-out」",
    why: "マスク方式・ハンドルの動かし方・入力系・タッチ対策まで指定されている。「clip-pathで切る」の一言が、画像が変形する事故を確実に防ぐ。",
  },
  vocab: [
    {
      term: "clip-path: inset()",
      desc: "矩形の切り抜き。上の画像を inset(0 X% 0 0) で切ると、2枚が同じ位置のまま「見える窓」だけが動く。widthを縮めると画像自体が潰れるので不可。",
    },
    {
      term: "setPointerCapture",
      desc: "ドラッグ中にポインタが要素外へ出てもイベントを受け続ける仕組み。これがないと枠外に出た瞬間ハンドルが置き去りになる。",
    },
    {
      term: "touch-action: none",
      desc: "ブラウザ既定のスクロール・スワイプ処理を無効化する指定。横ドラッグUIでは必須。忘れるとスマホでページごと動く。",
    },
    {
      term: "Pointer Events",
      desc: "マウス・タッチ・ペンを単一のイベント系で扱えるAPI。mousedownとtouchstartを二重に書くより短く安全。",
    },
  ],
  related: ["duotone-hover", "image-zoom-hover", "blur-load"],
};
