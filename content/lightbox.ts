import type { MotionEntry } from "@/lib/types";

export const lightbox: MotionEntry = {
  slug: "lightbox",
  category: "media",
  nameJa: "ライトボックス",
  nameEn: "lightbox zoom",
  lede: "サムネイルをクリックすると画像が画面中央へ拡大表示され、背景が暗転して1枚に集中させるUI。サムネイルから連続的に拡大するFLIPと、Esc・背景クリックで必ず閉じられる作法までがワンセット。",
  params: [
    {
      key: "duration",
      label: "duration(開閉時間 s)",
      min: 0.2,
      max: 1.0,
      step: 0.05,
      default: 0.45,
      desc: "0.3〜0.5sが目安。開くときと閉じるときを同じ時間にすると往復の対称性が出て上品。",
    },
    {
      key: "dim",
      label: "dim(暗転の濃さ)",
      min: 0.3,
      max: 0.95,
      step: 0.05,
      default: 0.75,
      desc: "背景オーバーレイのopacity。0.7〜0.85が定番。薄いと集中できず、濃すぎると閉じ方が分からず不安にさせる。",
    },
  ],
  promptTemplate: `画像ギャラリーに lightbox を実装してください。

- サムネイルをクリックしたら、その画像を画面中央に大きく表示する
- 拡大はFLIPで行う: サムネイルの位置を計測し、中央の拡大レイアウトへ差分transformをかけてから {{duration}}s のease-outで transform: none に再生する(サムネイルから連続的に拡大して見えること)
- 背景には黒のオーバーレイ(opacity {{dim}} 程度)を敷き、同じ {{duration}}s でフェードインする
- 閉じる操作は3系統用意する: 背景クリック / Escキー / 閉じるボタン。閉じるときは同じ経路を逆再生してサムネイルへ戻す
- 表示中は背面ページのスクロールをロックする
- transformとopacityのみで動かす(リフロー禁止)
- prefers-reduced-motion 時は拡大の動きを省き、即時表示・即時クローズにする`,
  ngExample: {
    say: "「画像をクリックしたら拡大表示できるようにして」",
    why: "サムネイルと無関係な位置からフワッと湧くだけのモーダルが返ってきがち。閉じる手段を指定しないと「×ボタンのみ」になり、Escも背景クリックも効かない閉じにくいUIになる。スクロールロック忘れも定番の事故。",
  },
  okExample: {
    say: "「lightboxを実装。サムネからFLIPで中央へ0.45s ease-out、背景はopacity 0.75の暗転を同時にフェード。背景クリック・Esc・×の3系統で閉じて逆再生で戻す。表示中はスクロールロック、transformとopacityのみ」",
    why: "開き方の起点(サムネからFLIP)・暗転の濃さ・閉じる3系統・戻りの対称性まで一文で固定。「サムネから拡大」の一言が、無関係な場所から湧くただのモーダルとの分かれ目。",
  },
  vocab: [
    {
      term: "オーバーレイ",
      desc: "背景に敷く半透明の暗幕。クリックで閉じる当たり判定も兼ねる。濃さ(opacity)が没入感と「まだページの上にいる」安心感のバランスを決める。",
    },
    {
      term: "スクロールロック",
      desc: "lightbox表示中に背面ページのスクロールを止める処理。忘れると背景だけが動く酔いやすいUIになる。bodyにoverflow: hiddenを付け、閉じるとき必ず戻す。",
    },
    {
      term: "Escで閉じる",
      desc: "モーダル系UIの必須作法。マウスを使わずに脱出できる経路を必ず残す(アクセシビリティ要件でもある)。keydownをwindowで拾い、閉じたら必ずリスナーを外す。",
    },
    {
      term: "FLIP拡大",
      desc: "サムネイル(First)から中央(Last)への差分をtransformで再生する開き方。「どこから開いたか」の連続性が出て、突然湧くモーダルと決定的に差がつく。",
    },
  ],
  related: ["shared-element", "modal-pop", "image-zoom-hover"],
};
