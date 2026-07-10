import type { MotionEntry } from "@/lib/types";

export const borderDraw: MotionEntry = {
  slug: "border-draw",
  category: "hover",
  nameJa: "ボーダードロー",
  nameEn: "border draw / outline animation",
  lede: "ホバーで枠線が一筆書きのように描かれていくボタン演出。4辺を擬似要素2つのscaleX/Yで順に伸ばす定番テクで、「囲まれる」過程そのものが視線を引く。",
  params: [
    {
      key: "duration",
      label: "duration(4辺合計の時間 s)",
      min: 0.3,
      max: 2.0,
      step: 0.05,
      default: 0.8,
      desc: "0.6〜1.0sが一筆書きらしさと待ち時間のバランス。1.5s超は描き終わる前に離脱される。",
    },
    {
      key: "thickness",
      label: "thickness(線の太さ px)",
      min: 1,
      max: 4,
      step: 1,
      default: 1,
      desc: "1〜2pxが上品。3px以上はポップな印象に寄るのでトンマナと相談。",
    },
  ],
  promptTemplate: `ボタンに border draw(ホバーで枠線が一筆書きのように描かれる演出)を実装してください。

- 枠線はborderではなく擬似要素2つ(::before / ::after)で作り、それぞれがL字型に2辺ずつを担当する
- 各辺は width/height ではなく transform: scaleX / scaleY で伸ばす(リフロー禁止)
- transform-origin を辺ごとに「描き始めの端」に設定し、transition-delay で 上→右→下→左 の順に連鎖させる
- 線の太さは {{thickness}}px、4辺合計 {{duration}}s(1辺あたり {{duration}}/4 s)、速度が均一に見えるよう linear で描く
- マウスが離れたら逆順(左→下→右→上)に消していく
- prefers-reduced-motion 時はアニメーションなしで枠線を常時表示する`,
  ngExample: {
    say: "「ホバーしたら枠が出るようにして」",
    why: "「出る」だけではborderの単純表示やopacityフェードが返ってくる。「一筆書き」の順序性と、どの角から描き始めるかは明示しないと伝わらない。",
  },
  okExample: {
    say: "「border drawを::before/::afterのL字2分割で。各辺scaleX/Y + transition-delayで上→右→下→左に連鎖、合計0.8s・線1px・linear。leaveは逆順で消す」",
    why: "実装方式(擬似要素のL字分割)・順序・数値・タイミング関数まで指定。「scaleで伸ばす」の一言がwidthアニメーションの重い実装を防ぐ。",
  },
  vocab: [
    {
      term: "L字分割",
      desc: "::beforeが上+右、::afterが下+左のように擬似要素2つに2辺ずつ担当させる定番の分割法。要素を増やさず4辺を制御できる。",
    },
    {
      term: "transition-delay",
      desc: "連鎖の要。前の辺のdurationぶん遅らせて開始すると1本の線が走って見える。",
    },
    {
      term: "transform-origin",
      desc: "各辺の伸び始めの位置。前の辺の終点と揃えないと線が「途中から生える」。",
    },
    {
      term: "scaleX / scaleY",
      desc: "width/heightをいじらず線を伸ばす。レイアウト計算(リフロー)が走らないので細い線でも滑らか。",
    },
  ],
  related: ["underline-reveal", "fill-hover", "lift-hover"],
};
