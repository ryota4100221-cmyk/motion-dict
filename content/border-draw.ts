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

- きっかけ: ボタンに mouseenter で描き、mouseleave で消す(タッチはタップごとに描く/消すを切り替える)。描いている途中で離れたら、その時点から逆順の消去に移る
- 枠線はborderではなく、ボタンの中に置いた装飾用の要素4つ(aria-hidden の span)で作り、1要素が1辺を担当する(上・右・下・左)。擬似要素2つのL字分割では1辺ずつ順に伸ばせないので使わない
- 各辺は width/height ではなく transform: scaleX / scaleY で伸ばす(リフロー禁止)
- transform-origin を辺ごとに「描き始めの端」(上=左端・右=上端・下=右端・左=下端)に設定し、transition-delay を i × ({{duration}}/4)s(i=0〜3)にして 上→右→下→左 の順に連鎖させる
- 線の太さは {{thickness}}px、4辺合計 {{duration}}s(1辺あたり {{duration}}/4 s)、速度が均一に見えるよう linear で描く
- マウスが離れたら逆順(左→下→右→上)に消していく。消すときの delay は (3 − i) × ({{duration}}/4)s、transform-origin は描くときと同じ端のまま
- prefers-reduced-motion 時はアニメーションなしで枠線を常時表示する`,
  ngExample: {
    say: "「ホバーしたら枠が出るようにして」",
    why: "「出る」だけではborderの単純表示やopacityフェードが返ってくる。「一筆書き」の順序性と、どの角から描き始めるかは明示しないと伝わらない。",
  },
  okExample: {
    say: "「border drawを1辺1要素(aria-hiddenのspan×4)で。各辺scaleX/Y + transition-delayで上→右→下→左に連鎖、合計0.8s・線1px・linear。leaveは逆順で消す」",
    why: "実装方式(1辺1要素)・順序・数値・タイミング関数まで指定。「scaleで伸ばす」の一言がwidthアニメーションの重い実装を防ぐ。",
  },
  vocab: [
    {
      term: "1辺1要素",
      desc: "4辺をそれぞれ別の要素にする。擬似要素2つのL字分割は要素が少なく済むが、1つの要素の中の2辺を別々の時刻に伸ばせないため、一筆書きの順序が作れない。",
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
