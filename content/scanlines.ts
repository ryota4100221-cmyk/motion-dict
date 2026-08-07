import type { MotionEntry } from "@/lib/types";

export const scanlines: MotionEntry = {
  slug: "scanlines",
  category: "media",
  nameJa: "スキャンライン",
  nameEn: "scanlines / CRT scanline overlay",
  lede: "細い横線のラスタを画面いっぱいに敷き、その上を走査バーが下から上へ一定速度で抜けていくブラウン管の質感演出。repeating-linear-gradient 1枚と transform だけで作れる軽さの割に、レトロ・ターミナル・観測装置といった世界観を画面全体へ一発で被せられる。",
  params: [
    {
      key: "spacing",
      label: "spacing(走査線の間隔 px)",
      min: 2,
      max: 10,
      step: 1,
      default: 4,
      desc: "3〜5pxがブラウン管らしい密度。2px以下は高DPIでモアレが出やすく、8pxを超えると質感ではなく「縞模様」として主張し始める。",
    },
    {
      key: "opacity",
      label: "opacity(オーバーレイの濃さ)",
      min: 0.05,
      max: 0.5,
      step: 0.01,
      default: 0.22,
      desc: "0.15〜0.25が、本文を読ませたまま質感だけ乗る範囲。0.35を超えると文字のコントラストを削り、長文が読めなくなる。",
    },
    {
      key: "sweep",
      label: "sweep(走査バーが抜ける時間 s)",
      min: 0,
      max: 16,
      step: 0.5,
      default: 8,
      desc: "6〜10sのゆっくりが上品。3s以下は視線を奪って読み物の邪魔になる。0にするとバーが消え、静止したラスタだけになる。",
    },
    {
      key: "flicker",
      label: "flicker(明滅の強さ)",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.35,
      desc: "ラスタを1秒周期でsteps()ごとに縦へ送る量(走査線間隔の半分×この値)。0.3前後で「同期がわずかに揺れている」感じが出る。1に近いほど故障した画面に寄る。",
    },
  ],
  promptTemplate: `画面に走査線を重ねる scanlines(CRTオーバーレイ)を実装してください。

- ラスタは position: fixed; inset: 0 のオーバーレイ1枚に持たせ、pointer-events: none と最前面の z-index を指定する(コンテンツ側のDOMには手を入れない)
- 走査線は repeating-linear-gradient(180deg, transparent 0, transparent {{spacing}}px の半分, 半透明の黒 同位置, 半透明の黒 {{spacing}}px)で敷く(線を1本ずつ要素で並べない)
- オーバーレイ全体の opacity は {{opacity}} にする(0.15〜0.25が目安。それ以上は本文のコントラストを削る)
- 走査バーは擬似要素1枚に「上端だけ明るい縦グラデーション」を描き、translate3d で画面の下から上端の外へ {{sweep}}s linear infinite で抜けさせる。top や margin ではなく transform で動かす(リフローさせない)
- 明滅はラスタの background-position-y を steps() で1秒周期に刻んで表現する。振れ幅は走査線間隔の半分に {{flicker}} を掛けた量とし、要素の再生成や毎フレームの再描画はしない
- オーバーレイは画面を暗くする役ではない。mix-blend-mode や全面の黒フィルタで下のコンテンツを沈ませない
- prefers-reduced-motion 時は走査バーの移動と明滅を止め、静止したラスタとしてだけ重ねる`,
  ngExample: {
    say: "「画面にレトロなブラウン管っぽい線を入れて」",
    why: "走査線を1本ずつdivで並べる実装(数百要素)や、線のPNGをrepeatする実装が返ってきがち。間隔と濃さの指定がないと opacity 0.5 の粗い縞が乗り、質感ではなく「壊れた画面」になって本文が読めなくなる。",
  },
  okExample: {
    say: "「scanlinesを実装。repeating-linear-gradientを4px間隔で敷いたfixedオーバーレイ1枚、opacity 0.22。走査バーは擬似要素をtranslate3dで8s linearに下から上へ。pointer-events: none、reduced-motionは静止」",
    why: "敷き方(gradient 1枚)・間隔・濃さ・バーの動かし方(transform)まで指定している。「repeating-linear-gradientで」の一言が、走査線をDOMで並べる実装を確実に防ぐ。",
  },
  vocab: [
    {
      term: "repeating-linear-gradient",
      desc: "同じグラデーションを一定間隔で繰り返す背景。走査線のような等間隔の縞は、要素を並べずこれ1枚で作れる。",
    },
    {
      term: "background-position-y",
      desc: "敷いた背景の縦方向のずらし量。繰り返し背景ではここを動かしても端が露出せず、ラスタを縦に送るだけで明滅になる。",
    },
    {
      term: "steps()",
      desc: "アニメーションを連続ではなく指定回数のコマに刻むイージング。ブラウン管の同期ズレは、滑らかに動かすと途端に嘘になる。",
    },
    {
      term: "pointer-events: none",
      desc: "その要素をクリック・ホバーの当たり判定から外す指定。最前面のオーバーレイには必須で、付け忘れると画面全体が押せなくなる。",
    },
  ],
  related: ["grain-overlay", "glitch-hover", "boot-sequence"],
};
