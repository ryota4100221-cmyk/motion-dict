import type { MotionEntry } from "@/lib/types";

export const tilt: MotionEntry = {
  slug: "tilt",
  category: "hover",
  nameJa: "tilt(3D傾き)",
  nameEn: "tilt / 3d tilt card",
  lede: "カーソル位置に応じてカードが3Dに傾く動き。perspectiveの奥行きとあわせて、平面のUIに物理的な立体感を与える。サムネイルやプロダクトカードで頻出。",
  params: [
    {
      key: "maxAngle",
      label: "maxAngle(最大傾き deg)",
      min: 2,
      max: 30,
      step: 1,
      default: 12,
      desc: "端にカーソルを置いたときの最大回転角。10前後が上品、20を超えると玩具っぽい。",
    },
    {
      key: "perspective",
      label: "perspective(奥行き px)",
      min: 300,
      max: 2000,
      step: 50,
      default: 800,
      desc: "小さいほど遠近が強調されて大げさに傾いて見える。",
    },
    {
      key: "scale",
      label: "scale(ホバー時の拡大)",
      min: 1,
      max: 1.15,
      step: 0.01,
      default: 1.04,
      desc: "傾きと同時にわずかに拡大すると「持ち上がる」印象になる。",
    },
  ],
  promptTemplate: `カードに tilt(3D傾き)を実装してください。

- カーソルのカード内での位置を -1〜1 に正規化し、rotateX / rotateY にマッピングする
- 最大回転角は {{maxAngle}}deg、perspective は {{perspective}}px
- ホバー中はカードを scale {{scale}} でわずかに拡大する
- 回転は毎フレーム lerp で補間し、カクつかせない
- mouseleave 時は回転と拡大をなめらかに 0 に戻す
- prefers-reduced-motion 時は傾きを無効化する`,
  ngExample: {
    say: "「カードをマウスでぐりぐり動くようにして」",
    why: "「ぐりぐり」が回転なのか移動なのか不明。回転軸・最大角・奥行きが未定義だと、傾きすぎて読めないカードや、逆にほぼ動かない実装になる。",
  },
  okExample: {
    say: "「tiltを実装。カーソル位置を正規化してrotateX/rotateYへマッピング、maxAngleとperspectiveは数値指定、leaveで0に戻す」",
    why: "マッピング方式と数値、終了時の挙動まで揃っている。tiltという名前だけで実装パターンが一意に伝わる。",
  },
  vocab: [
    {
      term: "perspective",
      desc: "3D変形の視点距離。値が小さいほどカメラが近く、遠近感が誇張される。",
    },
    {
      term: "rotateX / rotateY",
      desc: "X軸回転は上下の傾き、Y軸回転は左右の傾き。カーソルのY位置→rotateX、X位置→rotateYに対応させる。",
    },
    {
      term: "正規化(normalize)",
      desc: "カーソル位置を-1〜1の割合に変換する処理。要素のサイズが変わっても同じ傾き方になる。",
    },
    {
      term: "translateZ",
      desc: "カード内の要素を手前に浮かせる指定。テキストだけ浮かせると多層の立体感が出る。",
    },
  ],
  related: ["magnetic-hover", "spotlight-hover"],
};
