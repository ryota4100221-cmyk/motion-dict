import type { MotionEntry } from "@/lib/types";

export const grainOverlay: MotionEntry = {
  slug: "grain-overlay",
  category: "media",
  nameJa: "フィルムグレイン",
  nameEn: "film grain / grain overlay",
  lede: "画面にフィルム粒子のノイズを薄く乗せ続け、デジタルの平滑さを消す質感演出。feTurbulenceのdata URIなら画像ファイルもcanvasも不要で軽い。opacity 0.03〜0.08の「気づかれない濃さ」に留められるかが品位の分かれ目。",
  params: [
    {
      key: "opacity",
      label: "opacity(粒子の濃さ)",
      min: 0.01,
      max: 0.15,
      step: 0.01,
      default: 0.05,
      desc: "0.03〜0.08が「言われないと気づかない」適正域。0.1を超えると汚れに見え、可読性を削り始める。",
    },
    {
      key: "grain",
      label: "grain(粒の細かさ baseFrequency)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.8,
      desc: "feTurbulenceのbaseFrequency。大きいほど粒が細かい。0.6〜0.9がフィルムらしく、0.3台は粗粒でザラつきが主張する。",
    },
    {
      key: "fps",
      label: "fps(ゆらぎの更新回数 /秒)",
      min: 0,
      max: 24,
      step: 2,
      default: 12,
      desc: "8〜16でフィルムの明滅感が出る。0は静止テクスチャとして使える。24は砂嵐に寄る。",
    },
  ],
  promptTemplate: `画面全体にフィルム粒子のノイズを重ねる film grain を実装してください。

- ノイズは外部画像にせず、SVGの feTurbulence(type="fractalNoise"、baseFrequency={{grain}}、stitchTiles="stitch")+ feColorMatrix(saturate 0)を data URI 化して background-image に敷く
- グレインは position: fixed; inset: 0 のオーバーレイ1枚に持たせ、pointer-events: none と最前面の z-index を指定する(コンテンツ側のDOMには手を入れない)
- オーバーレイの opacity は {{opacity}} にする(0.03〜0.08が目安。それ以上は可読性を削る)
- ゆらぎはノイズの再生成ではなく、オーバーレイを毎秒 {{fps}} 回 transform: translate でランダムな位置に飛ばして表現する(オーバーレイは200%サイズで敷き、端の露出を防ぐ)
- stitchTiles="stitch" でタイルの継ぎ目を消す。SVGの生成は初回1回だけにし、毎フレーム作り直さない
- prefers-reduced-motion 時はゆらぎを止め、静止したテクスチャとして重ねる`,
  ngExample: {
    say: "「画面にノイズというかフィルムっぽい質感が欲しい」",
    why: "数百KBのnoise.pngを読み込む実装や、canvasで毎フレーム全ピクセルを描き直す重い実装が返ってきがち。濃さの指定がないとopacity 0.2〜0.3の「砂嵐」が乗り、質感ではなく画面の劣化に見える。",
  },
  okExample: {
    say: "「grain overlayを実装。feTurbulence baseFrequency 0.8+saturate 0のSVGをdata URIでfixedオーバーレイに敷き、opacity 0.05、毎秒12回translateでゆらす。pointer-events: none、reduced-motionは静止」",
    why: "生成方式(data URI)・濃さ・ゆらし方(再生成ではなくtranslate)まで指定している。「translateでゆらす」の一言が、毎フレームSVGを作り直す重い実装を防ぐ。",
  },
  vocab: [
    {
      term: "feTurbulence",
      desc: "パーリンノイズを生成するSVGフィルタ。fractalNoise型がフィルム粒子に近い。画像ファイルなしでノイズテクスチャを作れる。",
    },
    {
      term: "baseFrequency",
      desc: "ノイズの周波数=粒の細かさ。値が大きいほど細かい粒になる。0.6〜0.9あたりがフィルムグレインの定番域。",
    },
    {
      term: "data URI",
      desc: "画像をファイルではなく文字列としてCSSに埋め込む形式。SVGノイズはテキストなので軽く、HTTPリクエストも増えない。",
    },
    {
      term: "stitchTiles",
      desc: "feTurbulenceのタイル境界を連続させる指定。\"stitch\"にしないと、背景リピートの継ぎ目に線が出る。",
    },
  ],
  related: ["blob-morph", "ken-burns", "glitch-hover"],
};
