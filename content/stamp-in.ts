import type { MotionEntry } from "@/lib/types";

export const stampIn: MotionEntry = {
  slug: "stamp-in",
  category: "ui",
  nameJa: "スタンプ押し",
  nameEn: "stamp in / rubber stamp effect / stamp press",
  lede: "大きく傾いた判子が振り下ろされ、原寸で止まって少しだけ傾いたまま残る演出。承認バッジや「SOLD OUT」に使う。肝は着地角度を0にしないことで、ここを0にすると押した手の痕跡が消えてただの拡大縮小になる。",
  params: [
    {
      key: "scale",
      label: "scale(振り下ろし前の大きさ)",
      min: 1.1,
      max: 2.6,
      step: 0.1,
      default: 1.9,
      desc: "手が浮いている高さの見立て。1.5〜2.0が定番。2.4を超えると枠外から降ってくる別の動きに見える。",
    },
    {
      key: "angle",
      label: "angle(振りかぶり角度 deg)",
      min: 0,
      max: 40,
      step: 2,
      default: 26,
      desc: "開始時の傾き。着地角度との差が「手首がねじれて戻る」量になる。20〜30degが自然。0にすると真上から落ちるだけになる。",
    },
    {
      key: "rest",
      label: "rest(着地後に残る傾き deg)",
      min: -12,
      max: 12,
      step: 1,
      default: -8,
      desc: "押し終わって固定される角度。ここを0にすると印刷物のような整い方になり手押し感が消える。±5〜10degが手の癖に見える。",
    },
    {
      key: "duration",
      label: "duration(押し込み時間 s)",
      min: 0.2,
      max: 0.9,
      step: 0.02,
      default: 0.46,
      desc: "0.35〜0.5sが実測の相場。0.7sを超えるとゆっくり置いた感じになり、叩きつけた衝撃が出ない。",
    },
  ],
  promptTemplate: `承認バッジに stamp in(判子を押す動き)を実装してください。

- 初期状態は opacity: 0 / transform: scale({{scale}}) rotate(-{{angle}}deg)
- 発火で opacity: 1 / transform: scale(1) rotate({{rest}}deg) へ {{duration}}s で遷移させる
- easing は cubic-bezier(0.34, 1.3, 0.5, 1) のように終端でわずかに行き過ぎるものを使う(押し込んで戻る反力)
- 着地角度 {{rest}}deg は0にしない。傾きが残ることが「手で押した」の証拠になる
- 拡大と回転は transform でまとめて動かす(width/height やレイアウトプロパティは触らない)
- 台紙側は動かさない。判子だけが動くことで叩きつけた側とされた側が分かれる
- 回転の中心は判子の中心(transform-origin: center)に置く
- prefers-reduced-motion 時は拡大も回転も行わず、{{rest}}deg に固定したまま0.2sのフェードインだけで出す`,
  ngExample: {
    say: "「承認スタンプがドンって押される感じにして」",
    why: "「ドン」では開始スケールも着地角度も決まらない。中央から等倍でフェードインするだけの実装や、回転が0degで終わって印刷物に見える実装が返ってくる。バウンドを付けすぎて判子が跳ね回ることもある。",
  },
  okExample: {
    say: "「stamp inで。scale(1.9) rotate(-26deg)から scale(1) rotate(-8deg)へ0.46s、easingは cubic-bezier(0.34,1.3,0.5,1)。着地角度は0にしない。台紙は動かさない」",
    why: "開始姿勢・着地姿勢・時間・イージングを全部数値で渡している。特に「着地角度を0にしない」の一言が手押し感を決め、「台紙は動かさない」が画面全体の揺れを防ぐ。",
  },
  vocab: [
    {
      term: "オーバーシュート",
      desc: "終端で目標値を一瞬行き過ぎてから戻る挙動。cubic-bezierの第2制御点を1より大きくすると出る。判子が沈み込んで反発する感触になる。",
    },
    {
      term: "着地角度",
      desc: "アニメーション終了後に残る回転量。判子の演出では0にせず数degずらすのが定石で、これが手押しと機械印刷を分ける。",
    },
    {
      term: "transform-origin",
      desc: "拡大・回転の基準点。判子は中心を軸に回すので center。端を軸にすると振り子のように弧を描いて別の動きになる。",
    },
    {
      term: "fill: both",
      desc: "Web Animations APIで再生前後の状態を保持する指定。これが無いと押し終わった瞬間に初期状態へ戻り、判子が消える。",
    },
  ],
  related: ["press-feedback", "bounce-in", "confetti-burst"],
};
