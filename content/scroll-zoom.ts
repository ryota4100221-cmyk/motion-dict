import type { MotionEntry } from "@/lib/types";

export const scrollZoom: MotionEntry = {
  slug: "scroll-zoom",
  category: "scroll",
  nameJa: "スクロールズーム",
  nameEn: "scroll zoom / image scale on scroll",
  lede: "スクロールの進行に合わせて画像がゆっくり拡大(または縮小)していく演出。ヒーロー直下の大きな画像に仕込むと静止画に呼吸が生まれ、ページの奥へ引き込む力が出る。",
  params: [
    {
      key: "zoom",
      label: "zoom(最大倍率)",
      min: 1.05,
      max: 1.5,
      step: 0.05,
      default: 1.15,
      desc: "1.1〜1.2が上品。1.3を超えると画像の粗が見え、演出が主張しすぎる。",
    },
    {
      key: "direction",
      label: "direction(方向)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["in", "out"],
      desc: "inはスクロールで被写体に寄っていく。outは引いて全体が現れる。導入はin、種明かしはoutが定石。",
    },
  ],
  promptTemplate: `ヒーロー直下の画像に scroll zoom を実装してください。

- 画像を overflow: clip のフレームで包み、拡縮はフレーム内の画像側に transform: scale() でかける
- スクロール進捗0→1に対して、{{direction}} 方向で倍率1と {{zoom}} の間を線形に補間する(in: 1→{{zoom}}、out: {{zoom}}→1)
- 進捗はフレームがビューポート下端に入ってから上端へ抜けるまでのスクロール量を0〜1に正規化して求める
- scrollイベントでは進捗の更新のみ行い、transform の書き込みは requestAnimationFrame 側で行う
- width/height ではなく transform: scale で動かす(リフロー禁止)。はみ出しはフレームの clip で断つ
- prefers-reduced-motion 時は拡縮を止め、倍率1で固定表示する`,
  ngExample: {
    say: "「スクロールで画像がズームするようにして」",
    why: "方向・倍率・進捗の取り方がすべて未定義。ホバーズームと取り違えられたり、倍率2倍で画像が破綻する実装や、scrollイベント直書きでカクつく実装が返ってきやすい。",
  },
  okExample: {
    say: "「ヒーロー画像にscroll zoomを実装。overflow: clipのフレーム内で画像をscale 1→1.15、進捗はフレームの通過量から算出、書き込みはrAF側、reduced-motion時は倍率1で固定」",
    why: "コンテナ構造(clipフレーム)・倍率・進捗の定義・書き込みタイミングまで指定している。特に「フレーム内の画像側にscale」の一言でレイアウト崩れとはみ出しを防げる。",
  },
  vocab: [
    {
      term: "overflow: clip",
      desc: "はみ出しを描画だけ断つ指定。hiddenと違いスクロールコンテナ化せず、祖先のposition: stickyも殺さない。ズームの受け皿はこれが安全。",
    },
    {
      term: "scrub",
      desc: "時間ではなくスクロール量でアニメーションを進める方式。スクロールを戻せば巻き戻る。",
    },
    {
      term: "transform: scale",
      desc: "要素の拡縮。width/heightのアニメーションと違いリフローが走らず、画像の拡大はこれ一択。",
    },
    {
      term: "進捗(progress)",
      desc: "対象がビューポートを通過した割合を0〜1に正規化した値。scrub系の計算はすべてここから始まる。",
    },
  ],
  related: ["ken-burns", "parallax", "image-zoom-hover"],
};
