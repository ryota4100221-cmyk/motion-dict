import type { MotionEntry } from "@/lib/types";

export const glitchHover: MotionEntry = {
  slug: "glitch-hover",
  category: "hover",
  nameJa: "グリッチホバー",
  nameEn: "glitch effect / text glitch",
  lede: "ホバーで文字がRGBずれ＋ノイズ状に乱れるデジタル演出。clip-pathスライスとtext-shadowの2色ずらしで作る。強い印象を残せる反面、多用すると安っぽくなるので1画面1要素が目安。",
  params: [
    {
      key: "strength",
      label: "strength(ずれ量 px)",
      min: 1,
      max: 12,
      step: 1,
      default: 4,
      desc: "色ずれとスライスの最大オフセット。2〜5pxで十分効く。10px超は文字が読めなくなる。",
    },
    {
      key: "period",
      label: "period(乱れの周期 s)",
      min: 0.2,
      max: 2.0,
      step: 0.1,
      default: 0.7,
      desc: "ノイズパターン1周の時間。0.5〜1.0sが「機械の誤作動」らしい。短すぎるとただの点滅に見える。",
    },
  ],
  promptTemplate: `テキストに glitch hover(ホバーでRGBずれ＋ノイズ状に乱れる演出)を実装してください。

- テキストの複製を2層、擬似要素(::before / ::after、content: attr(data-text))で重ねる
- 各層を transform: translate で最大 {{strength}}px ずらし、text-shadow の2色ずらしで色収差を足す
- clip-path: inset() で層を横スライスし、keyframes + steps() でコマ送りに切り替えてノイズ感を出す({{period}}s で1周、infinite)
- アニメーションはホバー中のみ再生する。常時再生はしない
- 動かすのは transform / clip-path / opacity のみ(リフロー禁止)
- 適用は1画面1要素まで。多用すると安っぽくなる
- prefers-reduced-motion 時は乱れのアニメーションを止め、色の変化のみにする`,
  ngExample: {
    say: "「文字をグリッチさせてサイバーな感じにして」",
    why: "派手すぎて読めないもの、常時暴れ続けて目障りなもの、外部ライブラリ頼みの重い実装が返ってきがち。「ホバー中のみ」「ずれ幅の上限」を言わないと際限なく盛られる。",
  },
  okExample: {
    say: "「glitch hoverをdata-text＋擬似要素2層で。translateずれ最大4px＋text-shadow2色、clip-path inset＋steps()で0.7s周期、hover中のみ再生。reduced-motionでは停止」",
    why: "層の作り方(attr(data-text))・ずれの上限・周期・再生条件まで指定。steps()の指定が「滑らかに揺れるだけ」の失敗を防ぐ。",
  },
  vocab: [
    {
      term: "clip-pathスライス",
      desc: "inset()で上下を削り横帯だけ見せる手法。帯の位置をコマ送りで変えると「走査線の乱れ」になる。",
    },
    {
      term: "steps()",
      desc: "補間せずコマ送りで切り替えるタイミング関数。グリッチは滑らかに動かすと台無しになるので必須。",
    },
    {
      term: "RGBずれ(色収差)",
      desc: "色版が数pxずれた印象。text-shadowや複製レイヤーの色替えで再現する。chromatic aberrationとも呼ぶ。",
    },
    {
      term: "data-text属性",
      desc: "content: attr(data-text) で擬似要素に同じ文字列を複製する定番テク。HTMLに同じ文字を3回書かずに済む。",
    },
  ],
  related: ["text-scramble", "wave-text", "split-text-reveal"],
};
