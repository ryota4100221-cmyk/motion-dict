import type { MotionEntry } from "@/lib/types";

export const scrollSnap: MotionEntry = {
  slug: "scroll-snap",
  category: "scroll",
  nameJa: "スクロールスナップ",
  nameEn: "scroll snap / CSS scroll snapping",
  lede: "スクロールがセクション単位でピタッと止まるCSS標準の機能。JSでスクロールを乗っ取るハイジャックと違い、操作の主導権をユーザーに残したまま止まる位置だけを揃えるため破綻しにくい。フルスクリーンのプレゼン型ページの定番。",
  params: [
    {
      key: "strictness",
      label: "strictness(スナップ強制度)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["mandatory", "proximity"],
      desc: "mandatoryは必ずスナップ位置で止まる。proximityは近いときだけ吸い付き、途中でも止まれる。長いセクションが混ざるならproximity。",
    },
    {
      key: "align",
      label: "align(吸着位置)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["start", "center"],
      desc: "セクションのどこをスクロール位置に合わせるか。フルスクリーンはstart、カード列はcenterが定石。",
    },
  ],
  promptTemplate: `セクション単位でピタッと止まる scroll snap を実装してください。

- JSは使わず、CSSのみで実装する。スクロールコンテナに scroll-snap-type: y {{strictness}} を指定する
- 各セクションに scroll-snap-align: {{align}} を指定する(親子セットで書かないと何も起きない)
- wheelイベントを乗っ取ってスクロール位置をJSで動かす「スクロールハイジャック」は実装しない(操作の主導権はユーザーに残す)
- 固定ヘッダーがある場合は scroll-padding-top でスナップ位置をヘッダーの高さ分ずらす
- ビューポートより高いセクションが混ざる場合、mandatoryだと中身が読めなくなるため proximity に落とす
- prefers-reduced-motion 時は、scroll-behavior: smooth を併用しているなら auto に戻す(snap自体はユーザー操作主導なので残してよい)`,
  ngExample: {
    say: "「スクロールを1画面ずつピタッと止まるようにして」",
    why: "wheelをpreventDefaultしてJSでスクロールを奪うハイジャック実装が返ってきやすい。トラックパッドの慣性やスマホで挙動が破綻し、アクセシビリティも損なう。CSSのscroll-snapで済むことをJSで再発明させてしまう。",
  },
  okExample: {
    say: "「scroll-snap-type: y mandatory + 各セクションにscroll-snap-align: start、CSSのみで実装。JSのハイジャック禁止。ビューポートより高いセクションがあればproximityに落とす」",
    why: "CSSのみ・プロパティ名・強制度の使い分けまで指定している。「ハイジャック禁止」の一言で最悪の実装を確実に避けられる。",
  },
  vocab: [
    {
      term: "scroll-snap-type",
      desc: "スクロールコンテナ(親)側に置く宣言。軸(y / x / both)と強制度(mandatory / proximity)を決める。",
    },
    {
      term: "scroll-snap-align",
      desc: "子要素側に置く吸着位置の宣言。start / center / endから選ぶ。親のsnap-typeとセットで初めて効く。",
    },
    {
      term: "mandatory / proximity",
      desc: "必ず止まるか、近いときだけ吸い付くか。1画面に収まらないセクションがあるならproximity一択。",
    },
    {
      term: "スクロールハイジャック",
      desc: "JSがスクロール操作を乗っ取って位置を強制する手法。scroll-snapはその安全な代替で、操作の主導権がユーザーに残る。",
    },
    {
      term: "scroll-padding",
      desc: "スナップ位置のオフセット。固定ヘッダーの高さ分だけ止まる位置をずらすのに使う。",
    },
  ],
  related: ["sticky-pin", "horizontal-scroll", "scroll-fade-in"],
};
