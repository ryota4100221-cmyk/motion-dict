import type { MotionEntry } from "@/lib/types";

export const pillExpand: MotionEntry = {
  slug: "pill-expand",
  category: "ui",
  nameJa: "ピル展開",
  nameEn: "pill expand / expanding pill button",
  lede: "小さな円がポンと現れ、そのまま横に伸びてラベル付きのカプセルになるボタン演出。容器が伸びきってから文字を出す「順番」だけで、動きの丁寧さが決まる。",
  params: [
    {
      key: "duration",
      label: "duration(幅が伸びる時間 s)",
      min: 0.1,
      max: 0.6,
      step: 0.02,
      default: 0.24,
      desc: "0.2〜0.3sが軽快。0.4sを超えるとボタンが重く感じる。",
    },
    {
      key: "labelDelay",
      label: "labelDelay(ラベルが出るまで s)",
      min: 0,
      max: 0.5,
      step: 0.02,
      default: 0.26,
      desc: "durationとほぼ同じ値にすると、伸びきってから文字が出る。0にすると文字が容器からはみ出て見える。",
    },
    {
      key: "width",
      label: "width(展開後の幅 px)",
      min: 90,
      max: 220,
      step: 2,
      default: 140,
      desc: "ラベルの文字数で決める。畳んだ円の直径(40px)との差が大きいほど伸びが目立つ。",
    },
    {
      key: "origin",
      label: "origin(伸びる起点)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["left", "center", "right"],
      desc: "ライムの点が起点。画面端に置くピルは、端から内側へ伸びる向きを選ぶ。",
    },
  ],
  promptTemplate: `ホバーで開く pill expand ボタンを実装してください。

- 待機時はピルを非表示にする(opacity: 0 / transform: scale(0) / 幅は高さと同じ40pxの円)
- ホバーで scale(1) にポップさせ、続けて幅を {{width}}px へ {{duration}}s で伸ばす
- transform-origin は {{origin}} 側に置き、そこを起点に出現・伸長させる
- 幅は scaleX ではなく width をアニメーションさせる(scaleXだとラベルと角丸が歪む)
- ピル自体は position: absolute にして、幅の変化がページ側のレイアウトへ波及しないようにする
- ラベルは {{labelDelay}}s 遅らせて opacity で出す(容器が伸びきってから文字が現れる)
- 閉じるときは逆順にする。ラベルを先に消し、幅を縮め、最後に scale(0) へ畳む
- ホバーできない端末のために :focus-visible と tap でも同じ状態にする
- prefers-reduced-motion 時はアニメーションを止め、最初からラベル付きの展開状態で表示する`,
  ngExample: {
    say: "「ホバーでボタンが伸びてテキストが出るやつにして」",
    why: "「伸びる」だけではscaleXで潰れた実装が返ってきて、ラベルと角丸が横に歪む。容器とラベルを同時に出す実装になり、伸びきる前に文字がはみ出す。",
  },
  okExample: {
    say: "「pill expandを実装。待機はscale(0)の円、ホバーでscale(1)→widthを140pxへ0.24sで伸長。transform-origin: left。widthをアニメ(scaleX禁止)、absoluteでリフロー隔離。ラベルは0.26s遅れてfade in、閉じるときは逆順」",
    why: "伸ばす対象(width)・禁じ手(scaleX)・起点・容器とラベルの時間差・閉じる順番まで指定。この4点が揃うと実装者が違っても同じ動きになる。",
  },
  vocab: [
    {
      term: "pill(カプセル)",
      desc: "border-radius: 999pxで両端が半円になった形。幅が変わっても端の丸みが崩れないのが利点。",
    },
    {
      term: "width vs scaleX",
      desc: "scaleXは軽いがラベルと角丸まで横に潰す。ピルはwidthを動かし、absoluteでリフローの影響範囲を閉じ込めるのが定石。",
    },
    {
      term: "遅延の非対称",
      desc: "開くときは容器→ラベル、閉じるときはラベル→容器。同じ順番で往復させると閉じ際にもたつく。",
    },
    {
      term: "transform-origin",
      desc: "scale(0)から出現する起点。画面左端のピルなら left にしないと、外側へはみ出して生まれる。",
    },
  ],
  related: ["tooltip-pop", "dropdown-reveal", "shadow-pop"],
};
