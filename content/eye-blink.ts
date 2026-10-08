import type { MotionEntry } from "@/lib/types";

export const eyeBlink: MotionEntry = {
  slug: "eye-blink",
  category: "ui",
  nameJa: "まばたき（キャラクターの瞬き）",
  nameEn: "eye blink / idle blink / blinking mascot",
  lede: "マスコットやアイコンの目が数秒おきに閉じて開く、待機中の生き物らしさを出す動き。肝は間隔を毎回ずらすことと、ときどき二度続けて瞬かせることで、一定周期のままだと時計仕掛けの点滅にしか見えない。",
  params: [
    {
      key: "interval",
      label: "interval(瞬きの平均間隔 s)",
      min: 1.5,
      max: 8,
      step: 0.1,
      default: 4,
      desc: "次の瞬きまでの平均。実測は2.4〜5.2sで、3〜5sが落ち着いて見える。2s未満は緊張・眠気の演技になり、7sを超えると瞬きに気付かれず置物に見える。",
    },
    {
      key: "duration",
      label: "duration(1回の瞬きの長さ ms)",
      min: 80,
      max: 500,
      step: 10,
      default: 200,
      desc: "閉じ始めから開き終わりまで。150〜250msが自然で、閉じる側を速く(4割)、開く側をゆっくり(6割)にする。350msを超えると眠そうに、100ms未満はチカッと光ったように見える。",
    },
    {
      key: "jitter",
      label: "jitter(間隔のゆらぎ ±%)",
      min: 0,
      max: 60,
      step: 5,
      default: 35,
      desc: "毎回の間隔を平均から何%ずらすか。25〜40%で生き物らしくなる。0%だと等間隔の点滅になり、複数のキャラが並ぶと全員が同時に瞬いてしまう。",
    },
    {
      key: "double",
      label: "double(二度瞬きの確率 %)",
      min: 0,
      max: 100,
      step: 5,
      default: 25,
      desc: "1回の瞬きの直後にもう1回続ける確率。20〜30%で、ときどき入るのが効く。100%にすると毎回パチパチと二度になり、それがまた一定のリズムに戻ってしまう。",
    },
  ],
  promptTemplate: `マスコットの目に eye blink(待機中のまばたき)を実装してください。

- 目の要素を transform: scaleY(1 → 0.1 → 1) で縦につぶして瞬かせる。transform-origin は目の中心よりわずかに下(50% 60%)に置き、上まぶたが下りてくるように見せる
- 1回の瞬きは {{duration}}ms。閉じる側を前半4割で ease-in、開く側を残り6割で ease-out にし、開くほうをゆっくりにする
- 次の瞬きまでの間隔は平均 {{interval}}s。毎回 ±{{jitter}}% の範囲で乱数でずらし、setTimeout で1回ずつ次を予約する(一定周期の @keyframes infinite で回さない)
- {{double}}% の確率で、開き終わった直後(120ms後)にもう1回瞬かせる
- 複数のキャラを並べる場合は、それぞれ別々に予約して同時に瞬かないようにする
- クリック・タップされたらその場ですぐ瞬かせ、次の予約をそこから取り直す
- transform だけで動かす(height や clip-path は使わない)
- prefers-reduced-motion 時は自動の瞬きを止め、目を開いたまま静止させる`,
  ngExample: {
    say: "「キャラクターがときどき瞬きするようにして」",
    why: "「ときどき」が数値にならないので、animation: blink 4s infinite のような等間隔の点滅が返ってくる。閉じる・開くの速さも同じで、並べたキャラが全員そろって同時に瞬き、生き物ではなく時計仕掛けに見える。",
  },
  okExample: {
    say: "「eye blinkで。目を scaleY(1→0.1→1) でつぶし、transform-origin は 50% 60%。1回200ms、閉じ4割ease-in・開き6割ease-out。間隔は平均4s±35%を毎回乱数で予約、25%の確率で二度瞬き。キャラごとに独立、タップで即瞬き。reduced-motionでは開いたまま」",
    why: "瞬きの長さと閉じ開きの比率、間隔の平均とゆらぎ、二度瞬きの確率まで数値で渡している。「毎回乱数で予約」の一言が等間隔の点滅を防ぎ、「キャラごとに独立」が全員同時の瞬きを防ぐ。",
  },
  vocab: [
    {
      term: "アイドルアニメーション(idle animation)",
      desc: "操作がない待機中にだけ流す小さな動き。止まっていないことを示して、画面に生き物の気配を残す。",
    },
    {
      term: "ジッター(jitter)",
      desc: "周期に混ぜる小さな乱れ。平均は保ったまま毎回の間隔をずらすことで、機械的な繰り返しに見えなくなる。",
    },
    {
      term: "scaleY",
      desc: "縦方向の拡縮。目を縦につぶすと瞬きになる。height を動かすのと違いレイアウトが変わらず滑らか。",
    },
    {
      term: "二度瞬き(double blink)",
      desc: "短い間隔で続けて2回瞬くこと。人や動物は実際によくやり、たまに混ぜるだけで「本物らしさ」が一気に増す。",
    },
  ],
  related: ["breathing-glow", "ambient-float", "squash-stretch"],
};
