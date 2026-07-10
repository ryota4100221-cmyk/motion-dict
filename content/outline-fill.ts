import type { MotionEntry } from "@/lib/types";

export const outlineFill: MotionEntry = {
  slug: "outline-fill",
  category: "text",
  nameJa: "アウトラインフィル",
  nameEn: "outline fill / stroke text fill",
  lede: "縁取りだけの文字(-webkit-text-stroke)がホバーやスクロールで塗り文字に変わる演出。二重テキスト＋clip-pathで塗るのが定石で、どの方向から塗るかまで自在にコントロールできる。",
  params: [
    {
      key: "duration",
      label: "duration(塗る時間 s)",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.6,
      desc: "0.5〜0.8sが自然。大きい見出しほど面積が広いので、少し長めが落ち着く。",
    },
    {
      key: "direction",
      label: "direction(塗る方向)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["left", "bottom", "center"],
      desc: "leftは読む方向と揃って素直。bottomは満ちる印象、centerは開幕感が出る。",
    },
  ],
  promptTemplate: `見出しテキストに outline fill を実装してください。

- 同じテキストを2枚重ねる。下層は color: transparent + -webkit-text-stroke: 1px の縁取り、上層は塗りの文字
- 上層を clip-path: inset() で隠しておき、ホバーで inset(0 0 0 0) に {{duration}}s の ease で開いて塗る
- 塗る方向は {{direction}}。left は inset(0 100% 0 0) から、bottom は inset(100% 0 0 0) から、center は inset(0 50% 0 50%) から開く
- color の transition ではなく clip-path で動かす(方向が表現でき、リフローも起きない)
- 上層は aria-hidden にしてスクリーンリーダーの二重読み上げを防ぐ
- マウスが離れたら同じ duration で元の縁取りに戻す
- prefers-reduced-motion 時はアニメーションなしで塗り状態を常時表示する`,
  ngExample: {
    say: "「縁取り文字をホバーで塗りつぶして」",
    why: "実装方式と方向が未定義。colorのtransitionだけの実装(方向が表現できない)や、2枚重ねを知らずにstrokeとfillをフェードで切り替えるだけの実装が返ってくる。",
  },
  okExample: {
    say: "「outline fillを二重テキスト+clip-pathで実装。下層は-webkit-text-stroke 1px、上層をinset(0 100% 0 0)→inset(0)へ0.6s ease、上層はaria-hidden、reduced-motionは塗りを常時表示」",
    why: "レイヤー構成・clip-pathの初期値・時間・アクセシビリティまで指定。「clip-pathで」の一言で方向表現のある実装になる。",
  },
  vocab: [
    {
      term: "-webkit-text-stroke",
      desc: "文字の縁取りを描くプロパティ。color: transparent と組み合わせるとアウトライン文字になる。",
    },
    {
      term: "clip-path: inset()",
      desc: "上右下左の内側クリップ。inset(0 100% 0 0)→inset(0)のように値同士を補間でき、塗りの方向を自由に作れる。",
    },
    {
      term: "二重テキスト",
      desc: "縁取り層と塗り層に同じテキストを重ねる構成。塗り層だけをclip-pathで動かすのがこの動きの本体。",
    },
    {
      term: "aria-hidden",
      desc: "装飾用の重ねテキストを支援技術から隠す属性。二重テキスト構成では必須のケア。",
    },
  ],
  related: ["fill-hover", "underline-reveal", "gradient-shine"],
};
