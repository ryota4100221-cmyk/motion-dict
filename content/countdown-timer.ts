import type { MotionEntry } from "@/lib/types";

export const countdownTimer: MotionEntry = {
  slug: "countdown-timer",
  category: "ui",
  nameJa: "カウントダウン（締切の切迫）",
  nameEn: "countdown timer / urgency timer / ending-soon countdown",
  lede: "残り時間を H / M / S の区切りで1秒ずつ数え、締切が近づくと時計だけが明滅を始め、最後の数秒は周期が半分になって赤く変わる演出。数字そのものは動かさず「しきい値を越えたら状態を切り替える」2段の切迫で、オークション・限定販売・予約枠の「急げ」を煽りすぎずに伝える。",
  params: [
    {
      key: "closingAt",
      label: "closingAt(明滅を始める残り時間 s)",
      min: 40,
      max: 300,
      step: 5,
      default: 60,
      desc: "最後の1分(60s)が定番。オークションの入札のように1回の判断が短いものは60s、予約・購入のように入力が要るものは120〜300sにすると間に合う。短すぎると気付いたときには終わっている。",
    },
    {
      key: "finalAt",
      label: "finalAt(速く赤くする残り時間 s)",
      min: 3,
      max: 30,
      step: 1,
      default: 10,
      desc: "10sが「最後の秒読み」と読める長さ。5sを切ると赤に気付く前に終わり、20sを超えると赤い時間が長すぎて警告に慣れてしまう。",
    },
    {
      key: "period",
      label: "period(明滅の1往復 s)",
      min: 0.6,
      max: 3,
      step: 0.1,
      default: 1.6,
      desc: "最後の1分の呼吸の速さ。1.2〜2sで落ち着いた催促になる。最後の数秒はこの半分の周期にする(1.6s→0.8s)。0.8sを切ると最初から点滅に見えて2段目との差が出ない。",
    },
    {
      key: "dim",
      label: "dim(いちばん暗いときの opacity)",
      min: 0.2,
      max: 0.9,
      step: 0.05,
      default: 0.55,
      desc: "明滅の深さ。0.5〜0.65で数字を読めたまま脈打つ。0.3を切ると暗い瞬間に残り秒が読めず、0.8を超えると明滅していることに気付かない。",
    },
  ],
  promptTemplate: `オークションの出品一覧(写真・品名・残り時間の行が3つ)に countdown timer(締切の切迫を2段で伝えるカウントダウン)を実装してください。

- きっかけ: 操作は要らない。setInterval(1000ms) で毎秒「締切時刻 − 現在時刻」を秒で数え直し、残り時間の表示を書き換える。残りが {{closingAt}}s 以下になったら時計の要素に is-closing、{{finalAt}}s 以下で is-final を付ける(classList.toggle で付け外しするだけ。0 以下で両方外して "Ended" を出す)。デモでは3つの札を「残り2時間台」「{{closingAt}}s の2秒手前」「{{finalAt}}s の4秒手前」から始めて境目を越える瞬間を見せ、終わったら開始値へ戻してくり返す。「Restart countdown」ボタンで全部を開始値に戻す
- 表示は 時 / 分 / 秒 を2桁ゼロ埋めの区切り(数字の下に H M S の小さな単位、単位は 0.42em・opacity 0.55)。数字は font-variant-numeric: tabular-nums にして、秒が変わっても幅が揺れないようにする。数字自体にはアニメーションを付けない(書き換えるだけ)
- is-closing: 時計だけに @keyframes(50% で opacity {{dim}})を {{period}}s ease-in-out infinite で掛ける。札全体や行の背景は動かさない
- is-final: 同じアニメーションの animation-duration だけを {{period}}s の半分にし、文字色を #e0533d(赤)へ 0.2s で切り替える。行の状態ラベルも「Closing」(アクセント色)→「Final seconds」(同じ赤)に替える
- しきい値の判定は毎秒の tick の中でだけ行い、明滅は CSS アニメーションに任せる(JS で opacity を毎フレーム書かない)。opacity と color 以外は動かさない(レイアウトを変えない)
- prefers-reduced-motion 時は明滅を止め(animation: none)、色の切り替えと状態ラベルの文字だけで切迫を伝える。数字の書き換えは続ける`,
  ngExample: {
    say: "「締切が近いのが分かるようにタイマーを目立たせて」",
    why: "「目立たせて」では、いつから・どれだけ目立たせるのかが決まらない。最初から赤く点滅し続ける時計か、残り時間に関係なく数字がぴょこぴょこ跳ねる実装が返り、2段の切迫(最後の1分＝呼吸、最後の10秒＝速く赤く)が無いので本当に急ぐべき瞬間が伝わらない。",
  },
  okExample: {
    say: "「countdown timerで。残り60s以下でis-closing＝時計だけopacity 1→0.55→1を1.6s ease-in-out infinite、10s以下でis-final＝周期を0.8sに縮めて#e0533dに。数字は毎秒書き換えるだけでアニメしない」",
    why: "2つのしきい値と、それぞれで変えるもの(明滅の開始／周期と色)を値で指定した。明滅の対象を時計だけに限ったので、一覧の他の行は静かなまま締切の近い札だけが脈打つ。",
  },
  vocab: [
    {
      term: "urgency state",
      desc: "残り時間のしきい値で切り替える表示の段階。ここでは open → closing(最後の1分) → final(最後の10秒) → ended の4段。",
    },
    {
      term: "tabular-nums",
      desc: "数字を等幅にする font-variant-numeric の値。1 と 8 の幅が揃うので、秒が変わるたびに桁が左右に揺れない。",
    },
    {
      term: "clock skew",
      desc: "サーバーと端末の時計のずれ。締切時刻はサーバーから受け取り、ずれを足して残り秒を計算すると端末ごとに終わる時刻がばらつかない。",
    },
    {
      term: "role=\"timer\"",
      desc: "残り時間を表す要素だと支援技術に伝える ARIA ロール。毎秒の読み上げはしない(aria-live を付けない)のが既定。",
    },
    {
      term: "animation-duration の差し替え",
      desc: "同じ @keyframes のまま周期だけを変えて段階を表すやり方。is-final でアニメーションを付け替えず duration だけ半分にする。",
    },
  ],
  titleAct: { act: "breathing-glow", map: { period: "period*2", glow: 10, scale: 0 } },
  aliases: ["チカチカ", "ドキドキ", "残りわずか", "締切タイマー", "秒読み"],
  related: ["breathing-glow", "number-roll", "split-flap"],
};
