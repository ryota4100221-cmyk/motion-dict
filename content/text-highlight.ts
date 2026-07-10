import type { MotionEntry } from "@/lib/types";

export const textHighlight: MotionEntry = {
  slug: "text-highlight",
  category: "scroll",
  nameJa: "スクロールハイライト",
  nameEn: "scroll text highlight / reading highlight",
  lede: "スクロールの読み進みに合わせて、文章が左から薄い色→濃い色へ塗られていく演出。読者の視線と文字の状態が同期し、長文リードやマニフェストを「読ませる」推進力になる。",
  params: [
    {
      key: "offset",
      label: "offset(塗り開始位置 %)",
      min: 0,
      max: 40,
      step: 5,
      default: 15,
      desc: "ビューポート下端から何%上で塗り始めるか。15〜25%で読み始めと塗りが揃う。0だと画面に入った瞬間から塗られ始める。",
    },
    {
      key: "span",
      label: "span(塗り切る距離 %)",
      min: 20,
      max: 80,
      step: 5,
      default: 40,
      desc: "ビューポート高さの何%スクロールで1行を塗り切るか。40%前後が読速と合う。20%以下はスタンプのように一気に塗られる。",
    },
    {
      key: "stagger",
      label: "stagger(行ごとの遅れ %)",
      min: 0,
      max: 20,
      step: 2,
      default: 6,
      desc: "後の行ほど塗りを遅らせる量。0だと画面内の行が同時に塗られ、上から読み下ろす順序感が消える。",
    },
  ],
  promptTemplate: `長文リードに scroll text highlight を実装してください。

- 同じテキストを行ごとに2層重ねる。下層は薄い色(透明度20%程度)、上層は本来の文字色にする
- 上層を clip-path: inset(0 100% 0 0) で隠し、スクロール進捗に応じて inset(0 0 0 0) まで左から開く
- 進捗は行ごとに算出する。ビューポート下端から {{offset}}% 上の位置で0、そこからビューポート高さの {{span}}% ぶんスクロールしたら1になるよう線形にマップする
- 行には上から順に {{stagger}}% ずつ進捗の遅れを与え、読みの順序と塗りの順序を揃える
- scrollイベントでは値の更新のみ行い、clip-path の書き込みは requestAnimationFrame 側で行う
- width や background-position のアニメーションは使わない。clip-path(または background-clip: text + マスク)で塗り、リフローさせない
- prefers-reduced-motion 時はアニメーションを止め、全文を塗り済みの状態で表示する`,
  ngExample: {
    say: "「スクロールしたら文字がだんだん読めるようになるやつをやって」",
    why: "「だんだん」の基準が未定義。行単位でパッと切り替わる実装や、opacityのフェードインだけの実装が返ってきやすい。「左から塗る」「スクロール進捗に同期する」という核心が伝わらない。",
  },
  okExample: {
    say: "「テキストを2層重ね、上層をclip-path insetで左から開くscroll text highlightを実装。下端から15%上で塗り始め、viewport高さの40%で塗り切る。行ごとに6%ずつ遅らせる」",
    why: "実装方式(2層+clip-path)・開始位置・塗り切る距離・行の時差まで数値で指定している。「左から」と「進捗に同期」の2点を明示すると、フェードや一括切り替えの別物が返ってこない。",
  },
  vocab: [
    {
      term: "background-clip: text",
      desc: "背景を文字の形で切り抜くCSS。グラデーション背景と組み合わせると「文字だけを塗る」表現が作れる。2層重ねの代替になる。",
    },
    {
      term: "clip-path: inset()",
      desc: "要素を矩形で切り抜くマスク。右側の値を100%→0%に動かすと左から開く。transformと同じくリフローが走らない。",
    },
    {
      term: "scrub",
      desc: "アニメーションを時間ではなくスクロール量に直結させる方式。戻せば巻き戻る。GSAP ScrollTriggerの用語で、この動きの本体。",
    },
    {
      term: "stagger",
      desc: "複数要素に少しずつ時差を与えること。行ごとの塗りの遅れで「上から読み下ろす」順序を演出する。",
    },
  ],
  related: ["scroll-progress", "split-text-reveal", "scroll-fade-in"],
};
