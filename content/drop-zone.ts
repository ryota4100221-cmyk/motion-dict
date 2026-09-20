import type { MotionEntry } from "@/lib/types";

export const dropZone: MotionEntry = {
  slug: "drop-zone",
  category: "ui",
  nameJa: "ドロップゾーン",
  nameEn: "drop zone / drop target highlight / dropzone",
  lede: "掴んだものを近づけた瞬間、受け皿の側が縁とリングで「ここで受け取る」と名乗る動き。動かすのは運ぶ側ではなく受け皿で、box-shadowのspreadで出せばレイアウトを1pxも揺らさずに済む。",
  params: [
    {
      key: "ring",
      label: "ring(受け入れリングの太さ px)",
      min: 0,
      max: 14,
      step: 1,
      default: 7,
      desc: "spreadで外へ広がる量。6〜8pxが「囲まれた」と読める下限。12pxを超えると隣の要素と干渉して誤読される。",
    },
    {
      key: "respond",
      label: "respond(受け皿が応えきる時間 s)",
      min: 0.06,
      max: 0.8,
      step: 0.02,
      default: 0.2,
      desc: "0.15〜0.25sが自然。0.06s以下だと点滅に見え、0.5sを超えると「今ここで離していいのか」の判断が遅れる。",
    },
    {
      key: "shrink",
      label: "shrink(運ぶ間に縮むスケール)",
      min: 0.4,
      max: 1,
      step: 0.02,
      default: 0.56,
      desc: "受け皿の枠に収まる寸法まで縮める。0.5〜0.6が目安。1のままだと「入る先」が想像できない。",
    },
    {
      key: "settle",
      label: "settle(静止時に浮いている高さ px)",
      min: 0,
      max: 20,
      step: 1,
      default: 12,
      desc: "待機中の影の落差。10〜14pxが目安。受け入れ時はこれを0へ落とし、浮きをリングと交換する。",
    },
  ],
  promptTemplate: `ファイルやカードを受け取る枠に drop zone(ドロップゾーン)の反応を実装してください。

- 待機中の受け皿は box-shadow: 0 {{settle}}px calc({{settle}}px * 2.3) の影で少し浮かせ、枠線は淡い色にしておく
- 運んでいるものが受け皿に重なったら「受け入れ状態」にする。枠線をアクセント色へ変え、
  box-shadow の spread を 0 → {{ring}}px に広げてリングを出し、同時に浮きの影を0へ落とす
- リングは擬似要素のscaleではなく box-shadow の spread で出す(レイアウトを動かさない)
- 受け入れ状態への遷移は {{respond}}s の ease-out。離れたら同じ時間で戻す
- 運ばれる側は受け皿へ近づくほど scale を 1 → {{shrink}} に縮め、着地したらフェードで消して受け皿の中身に置き換える
- 判定は pointerenter ではなく「運搬中かつ重なっている」ときだけ。空ホバーで光らせない
- Pointer Events(pointerdown/move/up)と setPointerCapture で実装し、touch-action: none を付けてタッチでも同じ操作にする
- prefers-reduced-motion 時はトランジションを0にし、受け入れ状態を即座に切り替えるだけにする(色と枠の変化は残す)`,
  ngExample: {
    say: "「ドラッグ＆ドロップできるようにして」",
    why: "運ぶ側の実装だけが返ってきて、受け皿は無反応のままになる。どこで離せば入るのかが最後まで分からず、ユーザーは枠の真ん中を狙って何度も落とし直すことになる。光らせたとしても、空ホバーで全部の枠が光る実装になりがち。",
  },
  okExample: {
    say: "「drop zoneの受け入れ表現を。運搬中かつ重なっているときだけ枠線をアクセント色へ、box-shadowのspreadを0→7pxに広げてリングを出し、浮きの影12pxは0へ落とす。0.2s ease-outで、離脱も同時間で戻す。運ぶ側は近づくほどscale 0.56まで縮める。spreadで出すのでリフローなし。reduced-motionはtransition 0sで即切替」",
    why: "「受け皿が応える」という主役の置き方と、リングをspreadで出すという実装方式、判定条件(運搬中かつ重なり)、数値、復帰までを全部渡している。空ホバーで光る事故も先に潰せている。",
  },
  vocab: [
    {
      term: "drop target / drop zone",
      desc: "運んできたものを受け取る領域。HTMLのドラッグ&ドロップAPIでも drop target と呼ぶ、英語圏で通る名前。",
    },
    {
      term: "box-shadowのspread",
      desc: "影の4つ目の長さ。0 0 0 7px と書くと、ぼけない輪が要素の外へ7px広がる。要素の箱は変わらないのでリフローが起きない。",
    },
    {
      term: "アフォーダンス",
      desc: "「ここで離せば入る」と見た目自身が伝える性質。ドロップゾーンはこれを動きで名乗る典型例。",
    },
    {
      term: "setPointerCapture",
      desc: "掴んだ要素にポインタを固定する。枠の外へ速く動かしても move が途切れず、離した瞬間も確実に拾える。",
    },
    {
      term: "ドラッグゴースト",
      desc: "運搬中に指へ付いてくる分身。本体を動かさずゴーストだけ動かすと、戻したいときに元の並びが崩れない。",
    },
  ],
  related: ["fly-to-cart", "drag-scroll", "press-feedback", "pulse-ring"],
};
