import type { MotionEntry } from "@/lib/types";

export const barberPole: MotionEntry = {
  slug: "barber-pole",
  category: "media",
  nameJa: "バーバーポール（流れる斜めストライプ）",
  nameEn: "barber pole / hazard stripes / animated striped bar / candy stripe",
  lede: "斜めのストライプが横へ流れ続け、帯そのものが「注意」または「処理中」を語る古典的な意匠。理容店の看板・工事用の危険テープ・進捗バーの定番で、縞を1周期ぶん送るだけなので継ぎ目なく無限に回せる。",
  params: [
    {
      key: "cycle",
      label: "cycle(縞1周期が流れる時間 s)",
      min: 0.4,
      max: 6,
      step: 0.1,
      default: 3,
      desc: "縞1本ぶんが送られる時間。3s前後が「動いている」と読めて煩くない。1sを切ると視線を奪い、注意帯ではなく主役になってしまう。",
    },
    {
      key: "pitch",
      label: "pitch(縞の間隔 px)",
      min: 12,
      max: 96,
      step: 2,
      default: 48,
      desc: "縞の繰り返し幅(縞に対して直角方向)。帯の高さの1〜1.5倍にすると危険テープらしく、細かくするほど進捗バーの質感に寄る。",
    },
    {
      key: "ratio",
      label: "ratio(縞の太さ比)",
      min: 0.2,
      max: 0.8,
      step: 0.02,
      default: 0.54,
      desc: "pitchのうち色を塗る割合。0.5が等幅。0.5を少し超えると塗りが地に勝ち、帯の存在感が上がる。",
    },
    {
      key: "lean",
      label: "lean(縞の傾き deg・垂直からの角度)",
      min: 0,
      max: 60,
      step: 1,
      default: 17,
      desc: "0で垂直の縞、値を上げるほど寝る。45が理容店・危険テープの古典、15〜20は今回の観察元のように上品に流したいとき。",
    },
  ],
  promptTemplate: `帯に barber pole(流れる斜めストライプ)を実装してください。

- 縞は要素を並べず repeating-linear-gradient 1枚で敷く
- 縞の傾きは垂直から {{lean}}deg。gradientの角度は calc(90deg + {{lean}}deg) で渡す
- 縞の繰り返し幅は {{pitch}}px、そのうち {{ratio}} の割合を塗り、残りを地の色にする
- 送りは background-position ではなく内側トラックの transform: translate3d で行う(合成のみで再描画させない)
- 送る距離は「横方向の1周期」= pitch / cos(lean) ちょうど。半端に送ると1周ごとに縞が飛ぶ
- {{cycle}}s の linear で infinite。ease系を使うと周回の継ぎ目で速度が変わって見える
- 親を overflow: clip にしてトラックのはみ出しを隠す
- prefers-reduced-motion 時は animation を止め、静止した縞模様としてだけ残す(帯の意味は色と柄で伝わる)`,
  ngExample: {
    say: "「工事現場みたいな斜めストライプを流して」",
    why: "傾き・間隔・速さのどれも決まらない。要素をdivで何本も並べる実装や、backgroundを半端な距離だけ動かして1周ごとに縞が飛ぶ実装が返ってくる。",
  },
  okExample: {
    say: "「barber poleをrepeating-linear-gradientで。垂直から17度、pitch 48px、塗り54%、3s linear infinite。送りはtranslate3dでpitch/cos(lean)ぴったり、親はoverflow: clip」",
    why: "柄の作り方・角度・間隔・速さに加えて「送る距離をちょうど1周期に合わせる」まで指定している。継ぎ目が飛ぶ事故はこの一言で消える。",
  },
  vocab: [
    {
      term: "repeating-linear-gradient",
      desc: "同じ縞を無限に繰り返す背景。何本必要でもDOMは1つで済み、間隔と太さを数値だけで変えられる。",
    },
    {
      term: "1周期ぶん送る",
      desc: "柄の繰り返し幅ちょうどだけ動かすと、終端の絵が始端と完全に一致する。継ぎ目の見えない無限ループの原理。",
    },
    {
      term: "pitch / cos(lean)",
      desc: "縞が斜めのとき、横へ何px動かせば柄が1周するかの式。直角方向の間隔を横方向に読み替えている。",
    },
    {
      term: "linear",
      desc: "無限ループでは必須のイージング。ease系だと1周ごとに加減速が挟まり、そこが継ぎ目として見えてしまう。",
    },
    {
      term: "indeterminate(不定)",
      desc: "進捗率が出せない処理の表現。数字ではなく「流れ続ける縞」で作業中だけを伝える定番の型。",
    },
  ],
  related: ["marching-ants", "scanlines", "loading-bar"],
};
