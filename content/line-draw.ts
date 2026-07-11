import type { MotionEntry } from "@/lib/types";

export const lineDraw: MotionEntry = {
  slug: "line-draw",
  category: "media",
  nameJa: "SVGライン描画",
  nameEn: "svg line drawing / path draw",
  lede: "SVGパスが一筆書きのように端から描かれていく演出。実体はstroke-dasharrayとstroke-dashoffsetの数値操作で、パス全長をgetTotalLength()で実測するのが原理のすべて。署名・地図・イラストに「手が描いている時間」を宿せる。",
  params: [
    {
      key: "duration",
      label: "duration(1本を描く時間 s)",
      min: 0.5,
      max: 5,
      step: 0.25,
      default: 2,
      desc: "1.5〜3sが筆致として心地よい。5s近くは署名やロゴなど「儀式」として見せる場面向け。",
    },
    {
      key: "stagger",
      label: "stagger(パス間の時差 s)",
      min: 0,
      max: 1.5,
      step: 0.1,
      default: 0.4,
      desc: "複数パスを1本ずつ順に描く間隔。0で同時、0.3〜0.6にすると描く順番が物語になる。",
    },
    {
      key: "easing",
      label: "easing(筆の速度曲線)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["ease-in-out", "ease-out", "linear"],
      desc: "ease-in-outは手描きの筆致、linearは機械のプロッタ。世界観で選ぶ。",
    },
  ],
  promptTemplate: `SVGパスが一筆書きのように描かれていく line drawing を実装してください。

- 各パスの全長を path.getTotalLength() で実測し、stroke-dasharray と stroke-dashoffset の両方にその値を設定する(この状態で線は完全に不可視になる)
- stroke-dashoffset を 0 まで {{duration}}s / {{easing}} の transition で戻すと、パスの始点から線が描かれていく
- パスが複数ある場合は {{stagger}}s ずつ transition-delay をずらし、1本ずつ順に描く
- fill のある図形は線を描き終えてから fill-opacity をフェードインさせる(線と塗りを同時に出さない)
- vector-effect: non-scaling-stroke を指定し、レスポンシブ縮尺で線の太さが変わらないようにする
- prefers-reduced-motion 時はアニメーションなしで描画済みの状態を表示する`,
  ngExample: {
    say: "「SVGの線をアニメーションで描いて」",
    why: "原理を指定しないと clip-path や opacity のフェードで「なんとなく現れる」だけの実装が返ってくる。dasharrayに目分量の固定値(1000など)を入れる雑な実装も多く、パス全長と合わないため途中で止まる・一瞬で終わるが起きる。",
  },
  okExample: {
    say: "「line drawingを実装。getTotalLength()で全長を実測してdasharray/dashoffsetに設定、offsetを0へ2s ease-in-outで戻す。3本のパスは0.4sずつdelayで順に、reduced-motionは描画済み表示」",
    why: "dasharray方式であること・全長は実測であること・複数パスの順序まで指定している。「実測」の一語が、パス差し替えのたびに壊れる実装を防ぐ。",
  },
  vocab: [
    {
      term: "stroke-dasharray",
      desc: "破線の「線・間隔」の長さ指定。両方をパス全長にすると「全長ぶんの線1本+全長ぶんの空白」になり、描画アニメの下ごしらえが整う。",
    },
    {
      term: "stroke-dashoffset",
      desc: "破線パターンの開始位置をずらすプロパティ。全長→0へ動かすと空白が引っ込み、線が描かれていくように見える。",
    },
    {
      term: "getTotalLength()",
      desc: "SVGパスの全長を返すDOM API。dasharrayに入れる値はこの実測値を使う。目分量の固定値では途中で止まる。",
    },
    {
      term: "vector-effect: non-scaling-stroke",
      desc: "SVGが拡縮されてもstroke幅を画面上で一定に保つ指定。レスポンシブで線が太ったり痩せたりしない。",
    },
  ],
  related: ["border-draw", "marker-line", "blob-morph"],
};
