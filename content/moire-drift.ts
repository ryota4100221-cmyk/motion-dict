import type { MotionEntry } from "@/lib/types";

export const moireDrift: MotionEntry = {
  slug: "moire-drift",
  category: "media",
  nameJa: "モアレドリフト",
  nameEn: "moiré drift / moiré interference pattern",
  lede: "ピッチのわずかに違うドットグリッドを2枚重ね、片方だけをゆっくり送ると、格子そのものより十数倍大きな干渉縞が浮かんで画面を流れていく。動いている実体は背景1枚ぶんの平行移動だけなのに、目に映るのは印刷のアミ点ズレのような大きなうねりになる。",
  params: [
    {
      key: "pitch",
      label: "pitch(1枚目のドット間隔 px)",
      min: 4,
      max: 20,
      step: 0.5,
      default: 11,
      desc: "8〜13pxが、ドットが個別に見えつつ縞も読める範囲。5px以下は高DPIで点がつぶれ、16pxを超えると干渉ではなく水玉模様として主張し始める。",
    },
    {
      key: "beat",
      label: "beat(2枚目とのピッチ差 px)",
      min: 0.2,
      max: 3,
      step: 0.1,
      default: 0.9,
      desc: "縞の間隔を決める本体。pitch×(pitch+beat)÷beat がおよその縞間隔で、0.9pxなら約145px。差を広げるほど縞は細かくなり、2pxを超えるとうねりではなくチラつきに寄る。",
    },
    {
      key: "angle",
      label: "angle(2枚目の回転角 deg)",
      min: 0,
      max: 5,
      step: 0.1,
      default: 1.2,
      desc: "1〜2degが上品。0にするとピッチ差だけの縦横の縞になり、3degを超えると縞が細かく斜めに走って背景としてうるさい。",
    },
    {
      key: "cycle",
      label: "cycle(1タイル送る時間 s)",
      min: 6,
      max: 60,
      step: 1,
      default: 24,
      desc: "20〜30sのゆっくりが、気づくと変わっている速さ。10s以下は視線を奪い、読み物の背景には速すぎる。",
    },
  ],
  promptTemplate: `背景に moiré drift(2枚のドットグリッドの干渉)を実装してください。

- グリッドはドットを要素で並べず、radial-gradient(色 30%, transparent 32%) を background-image に敷いた擬似要素2枚(::before / ::after)で作る
- 1枚目の background-size は {{pitch}}px、2枚目は {{pitch}}px + {{beat}}px にする。このピッチ差が干渉縞の間隔(目安 pitch×(pitch+beat)÷beat px)を決める本体で、差が無ければ何も起きない
- 2枚目だけを rotate({{angle}}deg) 傾ける。角度が付くほど縞は細かく斜めに走る
- 動かすのは2枚目だけ。自分の回転軸に沿って translate3d でちょうど1タイル分({{pitch}}px + {{beat}}px)を {{cycle}}s linear infinite で送る。1タイル送れば背景の並びが元と一致するので、ループの継ぎ目が出ない
- 2枚とも opacity は 0.2〜0.35 に抑え、pointer-events: none を付ける。帯の上下は mask-image のグラデーションでぼかして切る(hard edgeで切ると装飾ではなく「パネル」に見える)
- 動かすのは transform だけ。background-position を毎フレーム書き換えて再描画させない
- 意味を持たない装飾なので aria-hidden を付ける
- prefers-reduced-motion 時はドリフトを止め、静止した干渉パターンとしてだけ敷く`,
  ngExample: {
    say: "「背景にモアレっぽい模様を入れて」",
    why: "モアレは「周期のわずかに違う2枚が重なって初めて出る」現象なのに、それが伝わらないと縞を1枚描いたSVGや、ドット背景をぐるぐる回すだけの実装が返ってくる。ピッチもズレ量も指定がないと、差が大きすぎて目に痛いチラつきになるか、差が小さすぎて何も浮かばないかのどちらかに転ぶ。",
  },
  okExample: {
    say: "「moiré driftを実装。radial-gradientのドットグリッド2枚をpitch 11pxと11.9pxで重ね、2枚目だけ1.2deg傾けて、その回転軸に沿って1タイル分=11.9pxを24s linearでドリフト。opacity 0.28、上下はmask-imageでフェード、reduced-motionは静止」",
    why: "2枚重ねる理由・ピッチ差・回転角・送る量まで数値で渡している。とくに「1タイル分だけ送る」の一言が、ループの継ぎ目が見える実装(中途半端な距離を往復させる等)を確実に防ぐ。",
  },
  vocab: [
    {
      term: "モアレ(moiré)",
      desc: "周期のわずかに違うパターンを重ねたときに現れる、元の周期より遥かに大きな干渉縞。印刷ではアミ点の角度ズレとして嫌われる現象を、装飾として意図的に使う。",
    },
    {
      term: "ビート(うなり)",
      desc: "2つの周期の差から生まれる大きな周期。ピッチ p と p+d の格子なら縞の間隔は約 p×(p+d)÷d で、見せたい縞の大きさから逆算してピッチ差を決められる。",
    },
    {
      term: "background-size",
      desc: "敷いた背景1タイルの大きさ。ドットグリッドのピッチはここで決まり、2枚のこの値の差がモアレそのものになる。",
    },
    {
      term: "1タイル送り(seamless loop)",
      desc: "繰り返し背景をちょうど1タイル分だけ動かすと終端の絵が開始と一致する。無限ループの継ぎ目を消す一般則で、マーキーでも同じ考え方を使う。",
    },
    {
      term: "mask-image",
      desc: "要素の見え方をグラデーションで抜く指定。装飾の帯を hard edge で切らず空気に溶かせる。",
    },
  ],
  related: ["scanlines", "grain-overlay", "marching-ants"],
};
