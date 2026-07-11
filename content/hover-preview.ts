import type { MotionEntry } from "@/lib/types";

export const hoverPreview: MotionEntry = {
  slug: "hover-preview",
  category: "hover",
  nameJa: "ホバープレビュー",
  nameEn: "hover preview / link image preview",
  lede: "リンクにホバーすると、その先の画像プレビューがカーソルに付いてくる動き。ワークス一覧や記事リストで「クリックする前に中身を見せる」ポートフォリオ定番。lerp追従の粘りと出現のscaleで質感が決まる。",
  params: [
    {
      key: "lerp",
      label: "lerp(追従の粘り)",
      min: 0.03,
      max: 0.5,
      step: 0.01,
      default: 0.12,
      desc: "小さいほどカーソルに遅れて「ぬるっと」付いてくる。0.1〜0.15が上品。",
    },
    {
      key: "duration",
      label: "duration(出現時間 s)",
      min: 0.15,
      max: 0.8,
      step: 0.05,
      default: 0.3,
      desc: "プレビューがフェード＋scaleで現れる時間。0.25〜0.35sが自然。",
    },
    {
      key: "scaleFrom",
      label: "scaleFrom(出現開始スケール)",
      min: 0.4,
      max: 1,
      step: 0.05,
      default: 0.8,
      desc: "出現時にこのscaleから1へ拡大する。0.8前後だと控えめに「ふわっと」出る。",
    },
  ],
  promptTemplate: `リンク一覧に hover preview を実装してください。

- 各リンクにホバーすると、対応する画像プレビュー(1枚)がカーソル位置に表示される
- プレビューの位置は毎フレーム lerp(係数 {{lerp}})で補間し、カーソルに遅れて付いてくる質感にする
- 出現は opacity 0→1 と scale {{scaleFrom}}→1 を {{duration}}s の ease-out で同時に行う
- リンクを離れたら同じ duration でフェードアウトする
- ホバー開始時は位置を即座にカーソルへスナップする(画面の隅から飛んでこないように)
- 移動は left/top ではなく transform: translate で行う(リフローさせない)
- プレビューは pointer-events: none にしてリンクのクリックを妨げない
- prefers-reduced-motion 時は追従・scaleを止め、カーソル位置にフェードなしで表示する`,
  ngExample: {
    say: "「リンクにホバーしたら画像がカーソルについてくるやつやって」",
    why: "追従の粘りも出現の仕方も未定義。カーソルにベッタリ張り付く硬い実装や、left/topを直接動かすカクつく実装が返ってくる。ホバー開始時のスナップ処理が抜けて画像が画面端から飛んでくる事故も定番。",
  },
  okExample: {
    say: "「hover previewを実装。translateをlerp 0.12で補間、出現はopacity+scale 0.8→1を0.3s ease-out、enter時は位置スナップ、pointer-events: none」",
    why: "追従方式(lerp)・出現アニメーション・初期位置の扱い・クリック阻害の回避まで指定。この4点が揃うと一発でポートフォリオ品質になる。",
  },
  vocab: [
    {
      term: "lerp",
      desc: "線形補間。毎フレーム目標位置に少しずつ近づける計算。カーソルに「遅れて付いてくる」質感の正体。",
    },
    {
      term: "pointer-events: none",
      desc: "要素をクリック・ホバーの対象外にする指定。プレビューが下のリンクを塞がないために必須。",
    },
    {
      term: "スナップ",
      desc: "ホバー開始の瞬間だけ補間せず位置を一致させる処理。これがないと前回の位置から画像が飛んでくる。",
    },
    {
      term: "image trailとの違い",
      desc: "trailは動きに合わせて残像を何枚も撒く。previewは1枚だけが追従し続ける。似て非なる動き。",
    },
  ],
  related: ["image-trail", "custom-cursor", "magnetic-hover"],
};
