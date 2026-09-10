import type { MotionEntry } from "@/lib/types";

export const ditherDissolve: MotionEntry = {
  slug: "dither-dissolve",
  category: "media",
  nameJa: "ディザディゾルブ（1bitの粒で溶ける）",
  nameEn: "dither dissolve / ordered dithering / Bayer dither / 1-bit reveal",
  lede: "画像の階調を白か黒かの粒だけに落とし、そのしきい値を動かして絵を出したり溶かしたりする表現。クロスフェードが「薄くなって消える」のに対し、こちらは濃さが粒の密度に置き換わるので、最後まで輪郭が硬いまま崩れる。",
  params: [
    {
      key: "pixel",
      label: "pixel(粒の大きさ px)",
      min: 1,
      max: 8,
      step: 1,
      default: 3,
      desc: "1粒ぶんのマス目。2〜4pxが「粗い画面で見ている」感じと元絵の可読性が両立する境目。6px以上は絵が読めなくなり、模様として使う領域。",
    },
    {
      key: "matrix",
      label: "matrix(しきい値マップ)",
      min: 0,
      max: 3,
      step: 1,
      default: 2,
      options: ["2×2", "4×4", "8×8", "noise"],
      desc: "粒を打つか打たないかを決める表。数字が大きいほど階調が滑らかで、8×8が写真向けの定番。noiseだけは毎フレーム引き直すので粒がザワつき続ける。",
    },
    {
      key: "cycle",
      label: "cycle(1往復の時間 s)",
      min: 1.5,
      max: 8,
      step: 0.5,
      default: 4,
      desc: "境目が画面を渡りきって戻るまでの時間。3〜5sが「溶けていく」と読める速さ。2s以下は瞬間的な切り替えに見えて質感が伝わらない。",
    },
    {
      key: "edge",
      label: "edge(境目の幅 %)",
      min: 0,
      max: 60,
      step: 5,
      default: 25,
      desc: "粗い側と元絵側が混ざる帯の幅。0%は硬いワイプ、20〜30%で「粒がほどけていく」中間状態が見える。60%は画面全体が常に半分ほど溶けた状態になる。",
    },
  ],
  promptTemplate: `画像に dither dissolve(ディザディゾルブ)を実装してください。

- 元画像をオフスクリーンcanvasへ描き、{{pixel}}px 角のセル単位で輝度を読む
- セルごとにしきい値マップ({{matrix}})と輝度を比較し、打つ/打たないの2値に落とす
- Bayer 行列は画面に固定して敷き、セル座標の剰余で引く。毎フレーム乱数で引き直すと粒が全面でちらつく(それを狙うときだけ noise を選ぶ)
- 画面を横切る境目を {{cycle}}s で1往復させ、境目の手前を2値、奥を元画像にする
- 境目は幅 {{edge}}% の帯でクロスさせ、2値レイヤーの不透明度を0→1で補間する
- 描画ループは requestAnimationFrame 1本にまとめ、setInterval で回さない
- getImageData を呼ぶcanvasは willReadFrequently: true で取得し、読み出しはリサイズ時の1回だけにする
- prefers-reduced-motion 時は境目を動かさず、2値化した1枚を静止表示する`,
  ngExample: {
    say: "「画像をレトロなドット絵っぽく出してほしい」",
    why: "「ドット絵っぽく」は解像度を落とすモザイクとも、網点(halftone)とも取れる。CSSの image-rendering: pixelated を当てただけの、階調がベタ潰れした実装が返ってくることが多い。",
  },
  okExample: {
    say: "「dither dissolveを実装。3px角のセルで輝度を読み、8×8のBayerしきい値マップで2値化。境目を4sで1往復させ、幅25%の帯で元画像とクロスさせる。rAFは1本、reduced-motionでは静止」",
    why: "2値化の方式(しきい値マップ)・粒の大きさ・境目の速度と幅まで数字で指定している。「Bayer」の一語があるだけでモザイクや網点と取り違えられなくなる。",
  },
  vocab: [
    {
      term: "ディザリング(dithering)",
      desc: "使える色数が足りないとき、粒の粗密で中間の濃さを錯覚させる手法。1bit時代の画面表示やモノクロ印刷の基礎技術。",
    },
    {
      term: "ベイヤー行列(Bayer matrix)",
      desc: "2×2から再帰的に作るしきい値の表。画面に固定して敷くので、同じ絵なら毎回同じ粒になり、ちらつかない。",
    },
    {
      term: "2値化(thresholding)",
      desc: "輝度がしきい値を超えたら打つ、超えなければ打たない、の判定。SVGフィルタなら feComponentTransfer の feFuncA type=\"discrete\" が同じ働きをする。",
    },
    {
      term: "誤差拡散(error diffusion)",
      desc: "Floyd–Steinberg に代表される別系統のディザ。粒が規則的に並ばず自然に見えるが、フレームごとに結果が変わるので動かすとザワつく。",
    },
    {
      term: "ハーフトーンとの違い",
      desc: "網点は「点の大きさ」で濃さを表し、ディザは「点の密度」で表す。ディザは粒の大きさが一定なので、低解像度の画面らしさが出る。",
    },
  ],
  related: ["halftone", "ascii-effect", "mosaic-reveal"],
};
