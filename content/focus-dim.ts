import type { MotionEntry } from "@/lib/types";

export const focusDim: MotionEntry = {
  slug: "focus-dim",
  category: "hover",
  nameJa: "フォーカスディミング",
  nameEn: "focus dimming / hover to focus",
  lede: "リスト内の1つにホバーすると、それ以外がスッと沈んで注目が集まる演出。制作会社やスタジオの実績リストで定番。効くのは「沈ませ具合」で、消しすぎない加減が肝。",
  params: [
    {
      key: "dimOpacity",
      label: "dimOpacity(沈む側の不透明度)",
      min: 0.1,
      max: 0.7,
      step: 0.05,
      default: 0.3,
      desc: "ホバーしていない側の濃さ。0.25〜0.4が上品。0.1まで下げると消えすぎて読めなくなる。",
    },
    {
      key: "dimBlur",
      label: "dimBlur(沈む側のぼかし px)",
      min: 0,
      max: 4,
      step: 0.5,
      default: 1,
      desc: "沈む側にかけるぼかし。0でも成立する。1〜2pxで奥に引く感じが出る。かけすぎると酔う。",
    },
    {
      key: "duration",
      label: "duration(切り替え時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      desc: "沈む/戻るの速さ。0.25〜0.4sが自然。速すぎるとチラつき、遅いと反応が鈍く感じる。",
    },
  ],
  promptTemplate: `リストに focus dimming(ホバーした項目以外を沈ませる)を実装してください。

- リスト全体をコンテナで包み、コンテナが :hover のときだけ全項目を「沈み」状態にする
- 個々の項目に :hover したものは沈みを打ち消して原寸(opacity 1 / blur 0)に戻す
- 沈み状態: opacity を {{dimOpacity}}、filter: blur({{dimBlur}}px)
- 切り替えは opacity と filter の transition を {{duration}}s ease で。transformは使わずレイアウトは動かさない
- タッチ端末では項目のタップでフォーカス対象をトグルする
- prefers-reduced-motion 時は transition を無効化し、沈み/フォーカスの状態変化は即時に切り替える(ぼかしは0でもよい)`,
  ngExample: {
    say: "「リストにホバーしたら他を薄くして」",
    why: "「薄く」がどこまでか決まらず、opacity 0 近くまで消して読めなくなったり、hoverした項目自身まで一緒に薄くなる実装が返ってくる。コンテナhoverと項目hoverの二段構えが要る、という発想が抜けやすい。",
  },
  okExample: {
    say: "「focus dimmingを。ul:hoverで全liをopacity 0.3+blur 1pxに沈め、li:hoverだけ打ち消して原寸に。0.3s ease、transformは使わない」",
    why: "『コンテナhoverで沈め、項目hoverで打ち消す』という二段の仕組みと、沈み量・速度・非transformの制約まで指定。CSSだけで破綻なく組める形になっている。",
  },
  vocab: [
    {
      term: "focus/dim(フォーカスとディミング)",
      desc: "注目させたい1つをそのままに、残りを沈ませて相対的に主役を立てる考え方。照明のスポットに近い。",
    },
    {
      term: "コンテナhover打ち消し",
      desc: "親:hoverで全体を沈め、子:hoverでその子だけ打ち消す二段構え。JS無しでも『ホバー中の1つだけ明るい』が作れる。",
    },
    {
      term: "filter: blur",
      desc: "沈む側に軽くかけると奥行きが出る。ただし重い処理なので値は小さく、対象数が多い時は省く判断も。",
    },
    {
      term: "非transform",
      desc: "opacity/filterだけで表現しレイアウトを動かさない。大きさや位置を変えないので行がガタつかず、長いリストでも安定する。",
    },
  ],
  related: ["lift-hover", "spotlight-hover", "directional-hover"],
};
