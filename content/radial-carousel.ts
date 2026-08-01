import type { MotionEntry } from "@/lib/types";

export const radialCarousel: MotionEntry = {
  slug: "radial-carousel",
  category: "ui",
  nameJa: "ラジアルカルーセル",
  nameEn: "radial carousel / wheel carousel / arc carousel",
  lede: "項目を大きな円の縁に並べ、輪ごと回して真上の1つを選ばせるカルーセル。回転の中心を画面の外へ逃がすほど弧はゆるくなり、横スライドでは出せない「奥行きのある目次」になる。",
  params: [
    {
      key: "radius",
      label: "radius(円の半径 px)",
      min: 200,
      max: 520,
      step: 20,
      default: 320,
      desc: "中心を画面外へ置く距離。280〜380pxが扱いやすく、大きいほど弧はゆるやかで上品になる。",
    },
    {
      key: "count",
      label: "count(1周に並べる項目数)",
      min: 6,
      max: 14,
      step: 1,
      default: 10,
      desc: "角度間隔は360÷countで決まる。10前後だと隣が視界に残り、全体量も伝わる。",
    },
    {
      key: "duration",
      label: "duration(スナップの時間 s)",
      min: 0.3,
      max: 1.4,
      step: 0.05,
      default: 0.7,
      desc: "指を離してから定位置に収まるまで。0.6〜0.9sで慣性がついているように見える。",
    },
    {
      key: "upright",
      label: "upright(ラベルの向き)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["正立させる", "輪と一緒に傾ける"],
      desc: "文字を読ませたいなら正立。傾けたままは装飾的だが、端の項目から先に読めなくなる。",
    },
  ],
  promptTemplate: `一覧に radial carousel(円弧の上を回るカルーセル)を実装してください。

- 回転の中心をステージの下・画面外に置き、半径 {{radius}}px の円の縁に項目を並べる
- 項目は {{count}} 個で1周させる(角度間隔 = 360 ÷ {{count}} 度)。円が閉じるので回転量に上限を設けない
- 位置は left/top ではなく transform: rotate() → translateY() の合成だけで作る(リフローさせない)
- ラベルは {{upright}}。正立させる場合は、輪の回転角と自分の配置角を足したぶんの逆回転を中身にかける
- ドラッグ/スワイプの横移動量を弧長とみなして角度に変換する(角度 = 移動px ÷ 半径 × 180 ÷ π)
- 指を離したら最寄りの項目の角度へ {{duration}}s の ease-out でスナップし、真上に来た1つをアクティブにする
- Pointer Events で実装し、回転領域は touch-action: none にしてタッチでも回せるようにする
- 真上から離れた項目はopacityで落として視界の外へ逃がす(DOMからは消さない)
- prefers-reduced-motion 時はスナップのトランジションを切り、回転結果を即座に確定させる`,
  ngExample: {
    say: "「カルーセルを円形にして、くるくる回るようにして」",
    why: "「円形」だけだと回転の中心が要素の内側に置かれ、項目が真円をぐるぐる回る観覧車になりがち。実務で欲しいのは中心を画面外へ逃がした「ゆるい弧」で、半径と項目数を言わないとその差は伝わらない。",
  },
  okExample: {
    say: "「radial carouselを実装。回転中心はステージ下の画面外、半径320pxの円に10項目で1周。ドラッグの横移動量を弧長として角度に変換し、離したら0.7sのease-outで最寄りにスナップ。ラベルは逆回転で正立、位置はtransformのみ」",
    why: "中心の位置・半径・項目数・入力の変換式・スナップ・正立処理まで指定している。特に「移動pxを弧長として角度へ」が無いと、指の動きと回転量が噛み合わない気持ち悪いカルーセルになる。",
  },
  vocab: [
    {
      term: "transform-origin",
      desc: "回転の基準点。ここを要素の外(下方)へ逃がすと、真円運動ではなく「ゆるい弧」の動きになる。",
    },
    {
      term: "逆回転 / counter-rotation",
      desc: "親の回転角にマイナスを掛けて子へ当てる処理。輪と一緒に傾いてしまう文字を正立させる常套手段。",
    },
    {
      term: "弧長",
      desc: "円周に沿った移動距離。ドラッグの移動pxをこれとみなし半径で割ると回転角(ラジアン)が出る。",
    },
    {
      term: "スナップ",
      desc: "指を離したあと最寄りの定位置へ吸着させること。角度を項目の角度間隔で丸めるだけで作れる。",
    },
  ],
  related: ["carousel", "drag-scroll", "rotating-badge"],
};
