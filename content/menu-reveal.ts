import type { MotionEntry } from "@/lib/types";

export const menuReveal: MotionEntry = {
  slug: "menu-reveal",
  category: "transition",
  nameJa: "メニューリビール",
  nameEn: "menu reveal / overlay menu animation",
  lede: "ハンバーガーを押すとオーバーレイが画面を覆い、ナビ項目が上から時間差で滑り込む定番の開閉演出。幕が下りる動きと項目のstaggerをどう重ねるかのタイミング設計がすべてで、ここが揃うとサイトの格が一段上がる。",
  params: [
    {
      key: "duration",
      label: "duration(オーバーレイの開閉時間 s)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "0.5〜0.8sが目安。ナビは毎回使うUIなので、演出優先で1sを超えると確実に鬱陶しくなる。",
    },
    {
      key: "stagger",
      label: "stagger(項目間の遅延 s)",
      min: 0.03,
      max: 0.15,
      step: 0.01,
      default: 0.06,
      desc: "0.05〜0.08sが心地よい。0.1sを超えると項目数×遅延ぶんの待ち時間が目立ち始める。",
    },
  ],
  promptTemplate: `ハンバーガーメニューに menu reveal を実装してください。

- オーバーレイは画面全体を覆う固定レイヤー(position: fixed、最上位のz-index)とし、transform: translateY(-101%)→0 に {{duration}}s で下ろす
- easingは cubic-bezier(0.77, 0, 0.175, 1) のようなease-in-out系を使う
- ナビ項目は各行を overflow: hidden のマスクで包み、内側のテキストを translateY(110%)→0 で滑り込ませる
- 項目は上から順に {{stagger}}s ずつ遅らせ、開始はオーバーレイが下り切る少し前(durationの5〜6割経過時点)に重ねて間延びを防ぐ
- 閉じるときは項目を先に(逆順で素早く)引き、少し遅れてオーバーレイを上げる
- 動かすのは transform と opacity のみ。メニューが開いている間は背面のスクロールを固定する
- prefers-reduced-motion 時はスライドとstaggerをやめ、フェードのみ(または即時)で開閉する`,
  ngExample: {
    say: "「ハンバーガーメニューをおしゃれにアニメーションさせて」",
    why: "幕と項目の時間関係が未定義。オーバーレイが完全に開き切ってから項目が動き出す間延び実装や、閉じるときに項目が置き去りのまま幕だけ上がる実装が返ってきやすい。",
  },
  okExample: {
    say: "「menu revealを実装。オーバーレイはtranslateY(-101%)→0を0.6s、ナビ各行はoverflow:hiddenのマスク+translateY(110%)→0を0.06sずらし。項目の開始は幕が下り切る少し前から。閉じは項目を逆順で先に引く。reduced-motionはフェードのみ」",
    why: "幕・項目・両者の重なり・閉じの順序まで指定できている。「下り切る少し前から」の一言で間延びが消える。",
  },
  vocab: [
    {
      term: "オーバーレイ",
      desc: "画面全体を覆うメニューの幕。position: fixed + 最上位z-indexで置き、transform(またはclip-path)で出し入れする。",
    },
    {
      term: "マスク+translateY",
      desc: "各行をoverflow: hiddenで包み、内側のテキストをずらして隠す手法。行が「切り抜きの中から立ち上がる」見え方になる。",
    },
    {
      term: "stagger",
      desc: "複数要素を一定間隔で遅らせて順に動かすこと。ナビ項目なら0.05〜0.08s間隔が定番。",
    },
    {
      term: "スクロールロック",
      desc: "メニューが開いている間、背面のbodyスクロールを止める処理。忘れると背景だけが流れてメニューと視界がずれる。",
    },
  ],
  related: ["circle-reveal", "curtain-wipe", "split-text-reveal"],
};
