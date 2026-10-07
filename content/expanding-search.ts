import type { MotionEntry } from "@/lib/types";

export const expandingSearch: MotionEntry = {
  slug: "expanding-search",
  category: "ui",
  nameJa: "展開する検索バー",
  nameEn: "expanding search bar / expandable search / search icon to input",
  lede: "虫眼鏡のボタンを押すと、その位置から検索欄が横に伸びて隣のナビや絞り込みの上に被さり、そのまま入力できる状態になる演出。普段は場所を取らず、使うときだけ一行ぶんの幅を借りるので、狭いヘッダーでも検索を「隠さずに」置ける。",
  params: [
    {
      key: "duration",
      label: "duration(伸びる時間 s)",
      min: 0.1,
      max: 0.8,
      step: 0.02,
      default: 0.2,
      desc: "0.2〜0.3sが定番（観察元は開閉とも0.2s ease-out）。0.4sを超えると、押してから打ち始めるまで待たされる。閉じるときも同じ値で戻す。",
    },
    {
      key: "startWidth",
      label: "startWidth(伸び始めの幅 px)",
      min: 40,
      max: 220,
      step: 2,
      default: 44,
      desc: "伸び始める幅。押したボタンと同じ幅にすると「ボタンがそのまま検索欄になった」と読める。ラベル付きのボタン（観察元は200px）なら、その幅から伸ばす。",
    },
    {
      key: "anchor",
      label: "anchor(固定する側)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["right", "left"],
      desc: "動かさない端。ボタンがヘッダーの右端にあるなら right（左へ伸びる）。押した位置から伸び始めないと、視線が欄を探しに行くことになる。",
    },
  ],
  promptTemplate: `ヘッダーの検索ボタンに expanding search bar を実装してください。

- 閉じた状態は虫眼鏡アイコンのボタンだけを置く。押したら、検索欄（form）を同じ行の上に position: absolute で重ねてマウントする（隣のナビは押しのけず、上に被せる）
- 検索欄は {{anchor}} 側の端を固定し、幅 {{startWidth}}px から行いっぱいまで {{duration}}s の ease-out で伸ばす。伸びている間は overflow: hidden で中身を切り取る
- 開いたら input に自動でフォーカスし、すぐ打てる状態にする。Esc キー・閉じるボタン・入力が空のままフォーカスが外れたときに閉じる
- 閉じるときは同じ {{duration}}s で {{startWidth}}px まで縮め、animationend を待ってからアンマウントする（縮む前に消さない）。閉じたらフォーカスを検索ボタンに戻す
- 検索欄は absolute で重ねているので幅を動かしても周囲はリフローしない。周囲を押しのける実装（flex の中で width を伸ばす）にはしない
- 検索ボタンに aria-expanded と aria-controls を付け、input には label（見えなくてよい）を付ける
- prefers-reduced-motion 時は伸縮アニメーションなしで、検索欄を最終の幅のまま即時に出し入れする（フォーカス移動などの挙動はそのまま）`,
  ngExample: {
    say: "「ヘッダーの検索アイコンを押したら、検索欄がにゅっと出るようにして」",
    why: "どこから・どちらへ伸びるか、周りをどう扱うかが決まらない。flex の中で input の width を 0→200px にして隣のメニューを毎フレーム押しのける実装や、閉じた瞬間に消えて縮むアニメが見えない実装、開いてもフォーカスが入らずもう一度クリックさせる実装が返ってきがち。",
  },
  okExample: {
    say: "「expanding search barを。右端固定で、ボタンと同じ44pxから行いっぱいまで0.2s ease-out、検索欄は absolute で隣のナビに被せる。開いたら input に自動フォーカス、Esc・閉じるボタン・空のままblurで0.2sかけて縮め、animationend 後にアンマウントしてボタンへフォーカスを戻す。reduced-motion は即時切り替え」",
    why: "固定する端・伸び始めの幅・尺に加えて、「被せる（押しのけない）」「縮み終わってから消す」「フォーカスの行き来」まで指定。見た目の伸び方だけでなく、検索として打ちやすく閉じやすいものが返ってくる。",
  },
  vocab: [
    {
      term: "expanding search bar / expandable search",
      desc: "アイコンだけの検索ボタンが、押すと入力欄に伸びる UI。英語圏では search icon to input、collapsible search の名でも通じる。",
    },
    {
      term: "overlay（被せる）と push（押しのける）",
      desc: "伸びた欄を隣の要素の上に重ねるか、隣を横へずらすか。重ねると周囲のレイアウトが動かず、幅のアニメーションもその要素の中だけで済む。",
    },
    {
      term: "exit animation（退場アニメーション）",
      desc: "要素を消す前に再生する動き。状態を閉じた瞬間にアンマウントすると縮む動きが見えないので、closing の状態を挟み animationend で外す。",
    },
    {
      term: "autofocus / focus return",
      desc: "開いたら入力欄へフォーカスを移し、閉じたら開いたボタンへ戻すこと。キーボード利用者が迷子にならず、マウス利用者も二度押しせずに打てる。",
    },
    {
      term: "aria-expanded",
      desc: "ボタンが制御する領域が開いているかを支援技術に伝える属性。検索ボタンに付け、開閉と同時に true / false を切り替える。",
    },
  ],
  related: ["pill-expand", "floating-label", "morphing-dropdown", "menu-reveal"],
};
