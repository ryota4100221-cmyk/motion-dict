import type { MotionEntry } from "@/lib/types";

export const imageTrail: MotionEntry = {
  slug: "image-trail",
  category: "hover",
  nameJa: "イメージトレイル",
  nameEn: "image trail / cursor trail",
  lede: "カーソルの軌跡に画像が次々と現れて消えていく演出。ポートフォリオのヒーローで作品を「散らして見せる」のに強い。肝は生成の間引きと寿命管理で、ここを指定しないと必ず重くなる。",
  params: [
    {
      key: "spacing",
      label: "spacing(生成間隔 px)",
      min: 20,
      max: 150,
      step: 5,
      default: 70,
      desc: "カーソルがこの距離動くごとに1枚生成。40〜80pxが密度と負荷のバランス。小さいほど濃い軌跡になるがDOMが増える。",
    },
    {
      key: "life",
      label: "life(カードの寿命 s)",
      min: 0.4,
      max: 2.0,
      step: 0.1,
      default: 1.0,
      desc: "出現から消え終わるまでの時間。0.8〜1.2sが残像らしい。長くすると画面が画像で埋まる。",
    },
  ],
  promptTemplate: `image trail(カーソルの軌跡に画像が次々現れて消える演出)を実装してください。

- mousemoveのたびに生成せず、前回の生成位置から {{spacing}}px 以上動いたときだけ1枚生成する(距離ベースの間引き)
- 各画像は出現時に scale 0.6→1 / opacity 0→1、{{life}}s 経過でフェードアウトし、必ずDOMから削除する(寿命管理)
- 同時表示は最大10枚程度に制限し、超えたら古いものから消す
- 位置はleft/topではなく transform: translate で決め、transform/opacityのみを動かす
- 画像は配列からローテーションで順に使う
- タッチデバイスではドラッグ追従にするか無効化する
- prefers-reduced-motion 時は軌跡を生成せず、静止した1枚の表示に留める`,
  ngExample: {
    say: "「カーソルに画像がついてくるおしゃれなやつをやって」",
    why: "単なるカーソルフォロワーが返ってくるか、mousemove毎に無制限生成してDOMが数百枚溜まる実装になりがち。間引きの基準と削除のルールは言わないと入らない。",
  },
  okExample: {
    say: "「image trailを実装。移動70pxごとに1枚生成・最大10枚・1s後にフェードして必ずremove。配置はtranslate、動かすのはtransform/opacityのみ」",
    why: "生成条件(距離)・上限枚数・削除タイミングまで数値で指定。「必ずremove」の一言がメモリリークと後半のカクつきを防ぐ。",
  },
  vocab: [
    {
      term: "距離ベースの間引き",
      desc: "時間ではなく移動距離で生成を制限する考え方。距離基準ならカーソルを速く動かしても等間隔に並ぶ。",
    },
    {
      term: "寿命管理",
      desc: "生成した要素をいつDOMから消すかの設計。消し忘れると要素が無限に増えてページ全体が重くなる。",
    },
    {
      term: "translate配置",
      desc: "left/topで動かすとリフローが走る。transformなら合成レイヤーだけで済み、枚数が増えても滑らか。",
    },
    {
      term: "ローテーション",
      desc: "画像配列を順繰りに使う選び方。ランダムと違い「同じ画像が連続する」事故が起きない。",
    },
  ],
  related: ["custom-cursor", "magnetic-hover", "image-zoom-hover"],
};
