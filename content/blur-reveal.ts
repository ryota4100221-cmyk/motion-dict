import type { MotionEntry } from "@/lib/types";

export const blurReveal: MotionEntry = {
  slug: "blur-reveal",
  category: "text",
  nameJa: "ブラーリビール",
  nameEn: "blur reveal / blur text in",
  lede: "文字がぼけた状態から徐々にピントが合うように現れるテキスト演出。opacityだけのフェードより空気感が出て、高級・幻想系サイトの見出しで定番。",
  params: [
    {
      key: "blur",
      label: "blur(初期のぼけ量 px)",
      min: 4,
      max: 24,
      step: 1,
      default: 10,
      desc: "8〜12pxが上品。24px近くまで上げると霧の中から浮かび上がる印象になる。",
    },
    {
      key: "duration",
      label: "duration(1文字の時間 s)",
      min: 0.2,
      max: 2,
      step: 0.05,
      default: 0.8,
      desc: "0.6〜1.0sが「ピントが合う」感じを出しやすい。短すぎるとただのフェードに見える。",
    },
    {
      key: "stagger",
      label: "stagger(文字間の遅延 ms)",
      min: 0,
      max: 200,
      step: 5,
      default: 60,
      desc: "40〜80msが自然。0で全文字同時、大きくするほど1文字ずつ順に浮かぶ。",
    },
  ],
  promptTemplate: `テキストに blur reveal(ぼかしから現れる演出)を実装してください。

- テキストを1文字ずつ span に分割する(spanは display: inline-block)
- 初期状態は filter: blur({{blur}}px) と opacity: 0
- 表示時に filter: blur(0) / opacity: 1 へ {{duration}}s の ease-out で遷移させる
- 文字ごとに {{stagger}}ms ずつ transition-delay をずらして順に現れるようにする
- filter はコンポジット負荷が高いので、適用は見出しなど短いテキストに限定し、本文全体には使わない
- アニメーション中のみ will-change: filter, opacity を効かせ、完了後は外す
- prefers-reduced-motion 時はぼかしアニメーションなしで即座に全文を表示する`,
  ngExample: {
    say: "「テキストをふわっとぼかして表示して」",
    why: "「ふわっと」だけではopacityフェードだけの実装が返ってきがち。ぼけ量・時間・文字ごとのずらしを指定しないと、ぼけが強すぎて読めない時間が長い実装や、本文全体にfilterをかけて重くなる実装になることも多い。",
  },
  okExample: {
    say: "「見出しをblur revealで。1文字ずつspan分割、blur(10px)+opacity:0からblur(0)へ0.8s ease-out、文字ごと60msのstagger。filterは見出し限定で本文には使わない」",
    why: "分割単位・初期ぼけ量・時間・staggerまで数値で指定し、filterの適用範囲も制限している。「見出し限定」の一言がパフォーマンス事故を防ぐ。",
  },
  vocab: [
    {
      term: "filter: blur()",
      desc: "ガウスぼかし。値が初期のぼけ量で、0に戻すとピントが合って見える。描画コストが高いので適用範囲を絞る。",
    },
    {
      term: "stagger",
      desc: "複数要素の開始時刻を一定間隔でずらすこと。文字ごとに遅延を足すと波のように順に現れる。",
    },
    {
      term: "will-change",
      desc: "変化するプロパティをブラウザに予告して描画準備させる。付けっぱなしはメモリを食うので完了後に外すのが作法。",
    },
    {
      term: "コンポジット負荷",
      desc: "filterやbox-shadowはピクセル単位の合成コストが高い。適用する要素数と面積を絞るのが基本。",
    },
  ],
  related: ["split-text-reveal", "text-scramble", "clip-reveal"],
};
