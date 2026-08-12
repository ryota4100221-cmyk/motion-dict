import type { MotionEntry } from "@/lib/types";

export const rowExpand: MotionEntry = {
  slug: "row-expand",
  category: "hover",
  nameJa: "行ホバー展開",
  nameEn: "row expand / expanding list row",
  lede: "ワークス一覧の行にホバーすると、その行のサムネイルが伸び上がる動き。下のキャプションを畳んで空いた分まで画像が飲み込むので、下の行を押し下げる量は変えないまま、見た目の拡大だけを大きく取れる。",
  params: [
    {
      key: "grow",
      label: "grow(拡大率 ×)",
      min: 1,
      max: 1.6,
      step: 0.05,
      default: 1.2,
      desc: "1.15〜1.25が実用域。1.4を超えると下の行が大きく押し下がり、一覧としての見通しが崩れる。",
    },
    {
      key: "duration",
      label: "duration(展開時間 s)",
      min: 0.15,
      max: 0.9,
      step: 0.05,
      default: 0.4,
      desc: "0.35〜0.45sが自然。高さが動くので0.2s以下だと隣の行までガクッと跳ねて見える。",
    },
    {
      key: "swallow",
      label: "swallow(キャプションの空き)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["飲み込む", "残す"],
      desc: "畳んだキャプションの高さを画像に足すか。押し下げ量は同じまま拡大幅だけを稼げるのがこの動きの肝。",
    },
  ],
  promptTemplate: `ワークス一覧に row expand(ホバーで行が展開する一覧)を実装してください。

- 各行は「サムネイルを横に並べた帯」＋「その下のキャプション(タイトル/分類)」の2段構成にする
- 行にホバーしたら、その行の帯の高さを {{grow}} 倍にする。サムネイルは height: 100% + aspect-ratio で幅を自動追従させ、動かす値を高さ1つに絞る
- キャプションは max-height と margin-top を 0 に畳む。畳んで空いた高さは {{swallow}} の指定に従って帯の高さへ足す
- 遷移は height / max-height / margin-top を {{duration}}s の ease-out で。transform: scale() は使わない(隣の行に重なり、文字がぼける)
- 行の高さが変わるのは意図したリフローなので、リスト要素を contain: layout で囲い、再計算をリストの中だけに閉じる
- ホバー状態は「いま開いている行」1つだけを保持する。行ごとにフラグを持つと、素早く移動したとき前の行が開いたまま取り残される
- タッチ端末では hover が張り付くので @media (hover: hover) で囲い、タップでのトグルを別に用意する
- prefers-reduced-motion 時は遷移時間を0にし、展開後の状態への即時切り替えだけを行う`,
  ngExample: {
    say: "「一覧の行をホバーで大きくして」",
    why: "「大きく」だけだと transform: scale() で拡大され、隣の行に重なって文字までぼける実装が返ってくる。キャプションの扱いも決まらないので、ホバーのたびに下の行が大きく飛ぶ一覧になる。",
  },
  okExample: {
    say: "「一覧の行をホバーで展開。帯の高さを1.2倍にし、下のキャプションはmax-height:0へ畳んでその高さを帯に加算。height/max-heightを0.4s ease-outで、scaleは使わない。開いている行は1つだけ保持。reduced-motionでは即時切り替え」",
    why: "拡大の手段(scaleではなくheight)・畳んだ空きの行き先・状態の持ち方まで決まっている。「scaleを使わない」の一言が、重なりと文字のぼけを最初から潰す。",
  },
  vocab: [
    {
      term: "aspect-ratio",
      desc: "縦横比の固定。高さだけを動かせば幅が自動で追従するので、アニメーションさせる値を1つに減らせる。",
    },
    {
      term: "max-height",
      desc: "高さの畳み方。height: auto はアニメーションできないため、キャプションのように高さが可変なブロックはここを0へ動かして畳む。",
    },
    {
      term: "contain: layout",
      desc: "レイアウト計算の影響範囲をその要素の内側に閉じ込める宣言。高さが動く演出では、ページ全体の再計算を避けるために効く。",
    },
    {
      term: "リフロー",
      desc: "大きさや位置が変わってレイアウトが計算し直されること。transformなら起きないが、この動きは「隣を押しのける」こと自体が目的なので、範囲を絞って許容する。",
    },
  ],
  related: ["lift-hover", "accordion", "hover-preview"],
};
