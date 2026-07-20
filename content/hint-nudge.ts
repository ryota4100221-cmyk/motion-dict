import type { MotionEntry } from "@/lib/types";

export const hintNudge: MotionEntry = {
  slug: "hint-nudge",
  category: "ui",
  nameJa: "ヒントナッジ",
  nameEn: "hint nudge / affordance nudge",
  lede: "「まだ続きがある」「ここは動かせる」を、矢印やカードを数pxだけ小刻みに揺らして伝える無言の案内。動かしすぎず、鳴らしっぱなしにしないのが要。",
  params: [
    {
      key: "distance",
      label: "distance(揺れ幅 px)",
      min: 2,
      max: 20,
      step: 1,
      default: 7,
      desc: "6〜10pxが目安。20pxも動くと案内ではなく主役になり、本文の邪魔をする。",
    },
    {
      key: "duration",
      label: "duration(1周の時間 s)",
      min: 0.6,
      max: 2.5,
      step: 0.1,
      default: 1.5,
      desc: "2回ゆらして1周。1.2〜1.8sが自然。速いと急かされている印象になる。",
    },
    {
      key: "rest",
      label: "rest(休止 s)",
      min: 0,
      max: 4,
      step: 0.2,
      default: 1.2,
      desc: "周と周の間の沈黙。0にすると永久ループになり、視界の端でちらつき続ける。",
    },
  ],
  promptTemplate: `スクロールできる横並びリストに hint nudge(操作を促すヒントアニメーション)を実装してください。

- リスト右端に矢印のヒント要素を置き、translateX で {{distance}}px だけ往復させる
- 1周は「0 → distance → 0 → distance → 0」の2回ゆらしで、{{duration}}s の ease-in-out
- 1周が終わったら {{rest}}s 休んでから次の周に入る(無限ループで鳴らし続けない)
- ユーザーがスクロールまたはスワイプしたらヒントは役目を終えるので停止する
- left や margin ではなく transform で動かす(リフローさせない)
- prefers-reduced-motion 時は揺らさず、矢印を静止したまま表示して意味だけ残す`,
  ngExample: {
    say: "「横スクロールできることが分かるようにアニメーションを付けて」",
    why: "揺れ幅も周期も休止も決まらない。矢印が延々と往復し続ける実装や、幅30pxで大きく踊る実装が返ってきて、案内のはずが視線泥棒になる。",
  },
  okExample: {
    say: "「右端の矢印に hint nudge を。translateXで7px、1.5s ease-in-outで2回ゆらして1.2s休止。ユーザーがスクロールしたら停止。reduced-motionでは静止表示」",
    why: "揺れ幅・周期・休止・停止条件の4点が揃っている。特に「触ったら止める」の指定が、案内を一度きりの合図として成立させる。",
  },
  vocab: [
    {
      term: "アフォーダンス",
      desc: "「これは動かせる」と形や動きで示す性質。ナッジはそれを動きで補う手段。",
    },
    {
      term: "ナッジ(nudge)",
      desc: "軽くつつく程度の小さな動き。指示ではなく合図なので、振幅は一桁pxに収める。",
    },
    {
      term: "休止(rest)",
      desc: "周と周の間の沈黙。ループアニメーションを「うるさくない」ものに変える最重要パラメータ。",
    },
    {
      term: "一度きりの合図",
      desc: "ユーザーが操作した時点でヒントの役目は終わる。実運用では停止状態を保存し、次回以降は出さない。",
    },
  ],
  related: ["scroll-snap", "carousel", "rubber-band"],
};
