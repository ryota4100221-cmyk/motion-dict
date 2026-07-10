import type { MotionEntry } from "@/lib/types";

export const underlineReveal: MotionEntry = {
  slug: "underline-reveal",
  category: "hover",
  nameJa: "下線アニメーション",
  nameEn: "underline reveal / animated link underline",
  lede: "ホバーで下線がスッと伸びるリンク演出。transform-originの位置で「どこから伸びるか」が決まり、それだけで印象が変わる。最小コストで効く定番マイクロインタラクション。",
  params: [
    {
      key: "duration",
      label: "duration(伸びる時間 s)",
      min: 0.15,
      max: 1.2,
      step: 0.05,
      default: 0.4,
      desc: "0.3〜0.5sが自然。1sを超えると待たされる感じになる。",
    },
    {
      key: "origin",
      label: "origin(transform-origin)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["left", "center", "right"],
      desc: "伸び始める起点。デモのライムの点がtransform-originの位置。",
    },
  ],
  promptTemplate: `リンクに underline reveal を実装してください。

- 下線は height 1px の擬似要素(::after)で作り、transform: scaleX(0) で隠しておく
- ホバーで scaleX(1) に、{{duration}}s の ease-out で伸ばす
- transform-origin は {{origin}} に設定する
- マウスが離れたら同じ duration で scaleX(0) に戻す
- width や border ではなく transform で動かす(リフローさせない)
- prefers-reduced-motion 時はアニメーションなしで下線を常時表示する`,
  ngExample: {
    say: "「リンクの下線をいい感じにアニメーションさせて」",
    why: "「いい感じ」では起点も速度も決まらない。widthをアニメーションさせる重い実装や、text-decorationのフェードだけの実装が返ってくることも多い。",
  },
  okExample: {
    say: "「underline revealを::after + scaleXで実装。transform-origin: left、0.4s ease-out、leaveで戻す。transformのみでリフロー禁止」",
    why: "実装方式(擬似要素+scaleX)と起点・数値・パフォーマンス制約まで指定。「transformで動かす」の一言が実装品質を分ける。",
  },
  vocab: [
    {
      term: "transform-origin",
      desc: "変形の基準点。scaleX(0→1)がどこから伸び始めるかはここで決まる。",
    },
    {
      term: "scaleX",
      desc: "横方向の拡縮。widthのアニメーションと違いレイアウト計算(リフロー)が走らず滑らか。",
    },
    {
      term: "::after",
      desc: "要素の末尾に生成される擬似要素。下線・装飾はここに持たせるとHTMLが汚れない。",
    },
    {
      term: "in-out非対称",
      desc: "入りは左から伸び、出は右へ消える、のように方向を変えると洗練される。originをホバー状態で切り替える。",
    },
  ],
  related: ["text-scramble", "magnetic-hover"],
};
