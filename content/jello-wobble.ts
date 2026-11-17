import type { MotionEntry } from "@/lib/types";

export const jelloWobble: MotionEntry = {
  slug: "jello-wobble",
  category: "hover",
  nameJa: "ゼリーの揺れ（ぷるんと傾いて戻る）",
  nameEn: "jello wobble / jelly wobble / skew wobble",
  lede: "文字や部品が足もとを軸に skew でぐっと傾き、反対へ小さく振れ返して止まる、ゼリーのような揺れ。肝は回転ではなくせん断で傾けることと、振れ返しを1回ごとに約4分の1へ減らすことで、隣にぶつけてつぶせば「押された」まで伝わる。",
  params: [
    {
      key: "skew",
      label: "skew(最初の傾き deg)",
      min: 0,
      max: 12,
      step: 0.1,
      default: 3.8,
      desc: "最初にいちばん大きく傾く角度。実測は左端の文字が3.8deg・右端が5.2deg。3〜6degで「ぷるん」に見え、8degを超えると倒れかけた看板になる。",
    },
    {
      key: "duration",
      label: "duration(揺れ1回の長さ s)",
      min: 0.3,
      max: 1.5,
      step: 0.02,
      default: 0.62,
      desc: "傾いて戻り、止まるまでの長さ。実測は0.62s。0.5〜0.8sが弾力に見え、1sを超えると水中のようにゆっくり揺れて重くなる。",
    },
    {
      key: "decay",
      label: "decay(振れ返しの減り方 倍)",
      min: 0,
      max: 0.6,
      step: 0.01,
      default: 0.24,
      desc: "1回振れ返すたびに振れ幅を何倍にするか。実測は3.8→0.9→0.3degでおよそ0.24倍。0.2〜0.35が硬めのゼリー、0.5を超えるといつまでも揺れてバネ仕掛けになる。0なら傾いて戻るだけ。",
    },
    {
      key: "knock",
      label: "knock(隣のつぶれ %)",
      min: 0,
      max: 15,
      step: 0.5,
      default: 6,
      desc: "傾いた文字に押された隣の文字が縦につぶれる量。実測は6%(scale 1.035, 0.94)。4〜8%が「コツン」で、12%を超えると殴られたように見える。0なら隣は動かない。",
    },
  ],
  promptTemplate: `見出しの文字に jello wobble(ゼリーの揺れ)を実装してください。

- きっかけ: 1文字ずつに分けた span への pointerenter(タッチは pointerdown)で、その文字を1回だけ揺らす。左半分の文字は右の隣へ、右半分の文字は左の隣へ向かって傾き、隣の文字にぶつける。揺れている途中に入り直しても重ねて開始しない。無操作が1.8s続いたら、左端→0.52s後に右端の順で自動で揺らし、これを繰り返す
- 各文字は display: inline-block の内側の span に transform を掛け、transform-origin は 50% 100%(足もと中央)。SVG の文字なら transform-box: fill-box も指定する
- 傾きは rotate ではなく skewX で作る。長さ {{duration}}s で、キーフレームは 0% / 28% / 55% / 78% / 100%。右へ傾く文字の skewX は 0 → −{{skew}}deg → +{{skew}}×{{decay}}deg → −{{skew}}×{{decay}}²deg → 0(左へ傾く文字は符号を逆に)
- easing はキーフレームの区間ごとに掛ける(全体に1本掛けない): 0→28% は cubic-bezier(0.55, 0, 0.9, 0.45)で溜めて傾き、28→55% は cubic-bezier(0.2, 0.8, 0.3, 1)で素早く振れ返し、残りの2区間は ease
- ぶつけられた隣の文字は、傾き始めから {{duration}}s×0.274 後に {{duration}}s×0.726 の長さでつぶれる。0% → 22% で押された向きへ translateX({{knock}}/300 em)・scale(1 + {{knock}}×0.0058, 1 − {{knock}}/100) → 55% で逆向きへ translateX({{knock}}/1800 em)・scale(1 − {{knock}}/600, 1 + {{knock}}/300) → 100% で元に戻す。区間ごとに ease
- 終わったら transform を外す。animation: infinite で揺らし続けない
- transform だけで動かす(width・letter-spacing・font-size は動かさない)
- prefers-reduced-motion 時は傾きもつぶれも出さず、ホバーした文字の色だけを変える`,
  ngExample: {
    say: "「ホバーしたら文字をぷるぷるさせて」",
    why: "「ぷるぷる」は数値にならないので、中心を軸にした rotate の左右往復や translateX のシェイクが infinite で返りやすい。足もとが浮いて文字が宙で震え、振れ幅も減らないのでゼリーではなくエラー表示に見える。",
  },
  okExample: {
    say: "「jello wobbleで。transform-originは文字の足もと中央、skewXで0.62s。28%で−3.8deg、55%で+0.9deg、78%で−0.2degに減らして100%で0。最初の区間は cubic-bezier(.55,0,.9,.45)、振れ返しは(.2,.8,.3,1)。0.17s後に隣の文字を scale(1.035, .94) でつぶす。1回きり、reduced-motionでは色だけ」",
    why: "軸(足もと)・傾け方(skewX)・振れ幅の減り方・区間ごとの緩急・隣へ伝わるタイミングまで指定している。「回さずにせん断」と「振れ返しを4分の1に」の2点が、震えやメトロノームとの違いを作る。",
  },
  vocab: [
    {
      term: "skewX(せん断)",
      desc: "上下の辺を平行に保ったまま横へずらす変形。足もとを止めて頭だけを傾けられるので、rotate よりも柔らかい物がしなる形になる。",
    },
    {
      term: "transform-origin: 50% 100%",
      desc: "変形の基準点を下辺の中央に置く指定。床に立っている文字は足もとが動かないことで「その場で揺れた」と読める。",
    },
    {
      term: "減衰振動(damped oscillation)",
      desc: "振れ返すたびに振れ幅が小さくなって止まる揺れ。減り方の倍率で、硬いゼリーにも緩いバネにも見え方が変わる。",
    },
    {
      term: "区間ごとの easing",
      desc: "CSS の keyframes の animation-timing-function は区間ごとに掛かる。溜めて傾く区間と素早く戻る区間で緩急を分けるのが弾力の正体。",
    },
    {
      term: "二次動作(secondary action)",
      desc: "主の動きに引きずられて起きる従の動き。傾いた文字に押されて隣がつぶれると、揺れに重さと接触が加わる。",
    },
  ],
  titleAct: { act: "error-shake", map: { amplitude: "skew*2", duration: "duration", shakes: 2 } },
  aliases: ["ぷるん", "ぷるぷる", "ゼリー", "ゆらっ", "コツン"],
  related: ["squash-stretch", "error-shake", "hover-wave", "spring-easing"],
};
