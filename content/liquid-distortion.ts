import type { MotionEntry } from "@/lib/types";

export const liquidDistortion: MotionEntry = {
  slug: "liquid-distortion",
  category: "media",
  nameJa: "液状ディストーション（変位マップの揺らぎ）",
  nameEn: "liquid distortion / displacement map warp / water ripple filter",
  lede: "ノイズを「どれだけピクセルをずらすか」の地図として使い、要素そのものを水面のように歪ませ続ける処理。ノイズを上に重ねるグレインと違い、中身の輪郭が動くので質感ではなく物理が変わって見える。WebGLなしにSVGフィルタだけで作れるのが利点。",
  params: [
    {
      key: "scale",
      label: "scale(歪みの強さ px)",
      min: 0,
      max: 60,
      step: 1,
      default: 22,
      desc: "変位マップが動かす最大ピクセル数。文字に掛けるなら12〜24pxが読める限界。40pxを超えると溶けて判読できなくなるので、背景や装飾面にだけ使う。",
    },
    {
      key: "frequency",
      label: "frequency(波の細かさ baseFrequency)",
      min: 0.004,
      max: 0.06,
      step: 0.002,
      default: 0.012,
      desc: "小さいほど大きくうねり、大きいほど細かく震える。水面らしさは0.008〜0.016。0.03を超えるとブレたノイズに近づく。",
    },
    {
      key: "duration",
      label: "duration(ゆらぎ1周の秒数)",
      min: 2,
      max: 20,
      step: 0.5,
      default: 9,
      desc: "8〜12sが「気づかれずに動き続ける」目安。3s以下は明確な脈動になり、背景のはずが視線を奪う。",
    },
    {
      key: "octaves",
      label: "octaves(重ねるノイズの層数)",
      min: 1,
      max: 4,
      step: 1,
      default: 2,
      desc: "層を増やすほど細部が複雑になるが計算量も比例して増える。2で十分で、3以上は常時再生する面には重い。",
    },
  ],
  promptTemplate: `要素に liquid distortion(SVG変位マップによる水面状の歪み)を実装してください。

- SVGフィルタを1つ定義する: feTurbulence(type="fractalNoise"、baseFrequency={{frequency}}、numOctaves={{octaves}}、seed固定、result="turb")→ feDisplacementMap(in="SourceGraphic"、in2="turb"、scale={{scale}}、xChannelSelector="R"、yChannelSelector="G")
- filter要素には x="-20%" y="-20%" width="140%" height="140%" と color-interpolation-filters="sRGB" を指定する(既定のlinearRGBだと色が沈み、余白がないと歪んだ端が切れる)
- 対象のHTML要素に CSS で filter: url(#フィルタID) を掛ける。IDはページ内で必ず一意にする
- 揺らぎは feTurbulence 内の <animate attributeName="baseFrequency"> で {{duration}}s・repeatCount="indefinite"・calcMode="spline" のイージング付きで往復させる。JSのrequestAnimationFrameでbaseFrequencyを毎フレーム書き換えるのは禁止(フィルタ再計算が毎フレーム走って重い)
- baseFrequencyはX/Yを別値にできる。横方向だけ細かくすると水平の水流、等値にすると全方向のうねりになる
- 常時再生する面なので、対象は画面の一部に限定し、テキスト本文には掛けない(可読性とアクセシビリティのため)
- prefers-reduced-motion: reduce のときは <animate> を出力せず、歪みを静止させたまま表示する(歪み自体は消さなくてよい。動きだけを止める)`,
  ngExample: {
    say: "「背景を水っぽくゆらゆらさせて」",
    why: "「水っぽく」だけだと canvas や three.js のシェーダで実装され、たった1枚の装飾のために数百KBのライブラリが入ることがある。歪みの強さと周期を数値で言わないと、1〜2秒周期で大きく波打つ「酔う背景」が返ってくるのもほぼ定番。",
  },
  okExample: {
    say: "「liquid distortionをSVGフィルタで。feTurbulence(fractalNoise, baseFrequency 0.012, numOctaves 2)→feDisplacementMap(scale 22, R/G)を作り、対象にfilter: url(#id)。baseFrequencyを9sでspline往復。WebGL不使用、reduced-motionでは静止」",
    why: "実装方式(SVGフィルタ)を名指しして重いWebGL実装を封じ、歪み量・細かさ・周期を数値で固定している。「reduced-motionでは静止」まで言えば、動きだけ止めて見た目は保つ正しい分岐になる。",
  },
  vocab: [
    {
      term: "feDisplacementMap",
      desc: "第2入力の色を「ずらし量」として読み、第1入力のピクセルを移動させるSVGフィルタ。歪み系の中核。",
    },
    {
      term: "feTurbulence",
      desc: "Perlinノイズを生成するSVGフィルタ。単体では雲状の模様だが、変位マップの入力にすると有機的な歪みになる。",
    },
    {
      term: "baseFrequency",
      desc: "ノイズの細かさ。小さいほど波長が長い。X/Yを別値にすると歪みに方向性が出る。",
    },
    {
      term: "color-interpolation-filters",
      desc: "フィルタ計算の色空間。既定のlinearRGBだと結果が暗く沈むため、sRGBを明示するのが実務の定石。",
    },
    {
      term: "SMIL(<animate>)",
      desc: "SVG組み込みのアニメーション要素。フィルタ属性はCSSから動かせないため、ここだけは現役で使う。",
    },
  ],
  related: ["grain-overlay", "blob-morph", "frosted-glass"],
};
