import type { MotionEntry } from "@/lib/types";

export const menuToggle: MotionEntry = {
  slug: "menu-toggle",
  category: "ui",
  nameJa: "メニュートグル",
  nameEn: "hamburger menu icon morph / animated menu toggle",
  lede: "ハンバーガーの3本線が、タップで滑らかに×へ変形する開閉トグル。上下の線を中央へ寄せて回し、真ん中を消す——この3つの動きを1本のtransitionで束ねるのが要点。アイコン全体を少し回すと操作の手応えが増す。ナビ開閉の起点として最頻出のマイクロインタラクション。",
  params: [
    {
      key: "duration",
      label: "duration(変形の時間 s)",
      min: 0.2,
      max: 0.8,
      step: 0.05,
      default: 0.4,
      desc: "0.3〜0.45sが軽快で自然。毎回触るUIなので0.6sを超えると開閉のたびに待たされる。",
    },
    {
      key: "thickness",
      label: "thickness(線の太さ px)",
      min: 2,
      max: 6,
      step: 1,
      default: 3,
      desc: "2〜3pxが繊細で上品。太くするほどカジュアル・力強い印象になる。×にしたときの交差の見え方もここで変わる。",
    },
    {
      key: "spin",
      label: "spin(全体の回転量 deg)",
      min: 0,
      max: 180,
      step: 45,
      default: 90,
      desc: "×へ変形する間にアイコン全体を回す角度。0は素直なクロス、90〜180で「ひねって閉じる」手応えが出る。180は半回転して戻る勢いのある印象。",
    },
  ],
  promptTemplate: `ハンバーガーメニューのアイコンに menu toggle(×への変形)を実装してください。

- ボタンの中に3本の線(span)を絶対配置し、上下は translateY で ±約7px、中央は 0 に置く。線の太さは {{thickness}}px、transform-origin は center
- 開いたとき(×): 上の線は translateY(0) rotate(45deg)、下の線は translateY(0) rotate(-45deg) にして中央で交差させ、真ん中の線は opacity 0(または scaleX 0)で消す
- 各線の translateY と rotate は1本の transform にまとめて同時に動かす(別々のtransitionにしない)
- アイコンを包むラッパーを開閉に合わせて rotate({{spin}}deg) し、変形にひねりの手応えを足す
- transition は transform と opacity を {{duration}}s、イージングは cubic-bezier(0.65, 0, 0.35, 1) のような ease-in-out 系
- ボタンには aria-label と aria-expanded を持たせ、状態をスクリーンリーダーに伝える。width/height ではなく transform で動かしリフローさせない
- prefers-reduced-motion 時は transition を切り、ハンバーガーと×を即座に切り替える`,
  ngExample: {
    say: "「ハンバーガーメニューのアイコンを押したら×になるようにして」",
    why: "変形の時間も、線がどう動いて×になるかも未定義。3本の線を別々の遅延で動かして交差がずれる実装や、アイコンを2枚用意して opacity で入れ替えるだけの「変形していない」実装が返ってきがち。",
  },
  okExample: {
    say: "「menu toggleを実装。3本線を絶対配置、開いたら上下をtranslateY(0)+rotate(±45deg)で中央交差・中央線はopacity 0、全体をrotate(90deg)。transformとopacityを0.4s ease-in-outで束ねる。aria-expanded付き、reduced-motionは即時切替」",
    why: "線の初期配置・×の作り方・全体回転・束ねるプロパティ・時間まで数値で指定している。「translateYとrotateを1本のtransformに束ねる」の一言で交差ズレが消え、aria-expandedでアクセシビリティも担保される。",
  },
  vocab: [
    {
      term: "複合transform",
      desc: "translateY と rotate を1つの transform プロパティにまとめて書くこと。別々のtransitionに分けると上下線の到達タイミングがずれ、×の交差が乱れる。",
    },
    {
      term: "transform-origin",
      desc: "回転・変形の基準点。3本の線を center 基準で回すと、上下の線が同じ中心で交差してきれいな×になる。",
    },
    {
      term: "aria-expanded",
      desc: "開閉状態を支援技術に伝えるWAI-ARIA属性。見た目の×だけでなく true/false を切り替えると、スクリーンリーダー利用者にも状態が伝わる。",
    },
    {
      term: "アイコンモーフ",
      desc: "2枚の絵を差し替えるのではなく、同じ要素を変形させて別の記号に見せる手法。差し替えより「動きが繋がる」ため状態変化が理解しやすい。",
    },
  ],
  related: ["menu-reveal", "toggle-switch"],
};
