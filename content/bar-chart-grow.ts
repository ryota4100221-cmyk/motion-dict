import type { MotionEntry } from "@/lib/types";

export const barChartGrow: MotionEntry = {
  slug: "bar-chart-grow",
  category: "ui",
  nameJa: "棒グラフの伸長",
  nameEn: "animated bar chart / bar chart grow-in / chart entrance animation",
  lede: "ダッシュボードやKPIカードの棒グラフが、基線から1本ずつ時間差で伸びて値に届く登場演出。数字を読む前に「左から右へこう推移した」という形が先に伝わる。肝は基線を固定する transform-origin と、本と本の間隔を詰めた stagger。",
  params: [
    {
      key: "duration",
      label: "duration(1本が伸びる時間 s)",
      min: 0.2,
      max: 1.2,
      step: 0.02,
      default: 0.46,
      desc: "0.4〜0.6sが実務の目安。0.3s未満だと伸びる途中が見えず一斉に出たのと変わらない。1sを超えると数字を読みたい人を待たせる。",
    },
    {
      key: "stagger",
      label: "stagger(本ごとの遅延 ms)",
      min: 0,
      max: 200,
      step: 10,
      default: 70,
      desc: "60〜90msで左から右へ波が走って見える。0だと全本が同時に伸びて推移が伝わらない。150msを超えると本数×遅延で最後の1本が遅れすぎる。",
    },
    {
      key: "easing",
      label: "easing(伸び方)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["ease-out-quint", "back-out", "linear"],
      desc: "ease-out-quint(0.22,1,0.36,1)は素早く伸びて値の手前で静かに止まる定番。back-outは一度値を超えて戻るので弾みは出るが、一瞬だけ誤った値を見せることになる。linearは機械的。",
    },
    {
      key: "method",
      label: "method(伸ばし方)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["scaleY", "clip-path"],
      desc: "scaleYは最も軽いが、伸びる途中で角丸まで縦に潰れる。角丸のバーで潰れが気になるならclip-pathのinset()で下から切り抜いて出す。",
    },
  ],
  promptTemplate: `KPIカードの棒グラフに bar chart grow-in(棒が基線から伸びる登場演出)を実装してください。

- 各バーは最終の高さ(値に比例した%)で先にレイアウトしておき、アニメーションでは高さを変えない(height のアニメーションはリフローを起こすので禁止)
- 伸ばし方は {{method}} を使う。scaleY の場合は scaleY(0)→scaleY(1)、transform-origin: bottom で基線を固定する。clip-path の場合は inset(100% 0 0 0 round <角丸>)→inset(0 round <角丸>) で下から切り抜く
- 1本あたり {{duration}}s、イージングは {{easing}}(ease-out-quint なら cubic-bezier(0.22, 1, 0.36, 1)、back-out なら cubic-bezier(0.34, 1.56, 0.64, 1))
- 左のバーから順に {{stagger}}ms ずつ animation-delay をずらす。遅延は CSS 変数 --i にインデックスを入れて calc(var(--i) * {{stagger}}ms) で計算する
- animation-fill-mode: both にして、遅延中のバーは高さ0のまま待たせる(遅延中に全高が一瞬見えるのを防ぐ)
- 発火はグラフが画面に入った瞬間の1回だけ(IntersectionObserver)。スクロールで戻るたびに再生し直さない
- バーには値を aria-label か視覚的に隠したテキストで持たせ、アニメーションが無くても値が読めるようにする
- prefers-reduced-motion 時はアニメーションを無効にし、最初から最終の高さで表示する`,
  ngExample: {
    say: "「グラフが表示されるときにアニメーションさせて」",
    why: "どこから伸びるかが決まらず、transform-origin が既定の center のまま上下両方向に膨らむ実装や、height を直接アニメーションさせてカクつく実装が返ってきやすい。全本が同時に出て推移が伝わらない、遅延中に一瞬だけ全高が見えてから縮む、という定番の崩れも起きる。",
  },
  okExample: {
    say: "「棒グラフにbar chart grow-inを実装。scaleY(0→1)・transform-origin: bottom、0.46s cubic-bezier(0.22,1,0.36,1)、--iで70msずつstagger、fill-mode: both。画面に入ったとき1回だけ発火、reduced-motionでは最初から最終の高さ」",
    why: "伸ばす手段・基線の位置・時間・イージング・時間差・遅延中の見え方・発火条件まで確定している。特に transform-origin: bottom と fill-mode: both の2つが「棒グラフらしく下から伸びる」と「伸びる前にチラつかない」を同時に守る。",
  },
  vocab: [
    {
      term: "基線(baseline)",
      desc: "棒グラフの0の位置。バーは必ずここを固定して伸ばす。scaleYなら transform-origin: bottom で指定する。",
    },
    {
      term: "stagger",
      desc: "同じ動きを要素ごとに一定時間ずつ遅らせて連鎖させる手法。棒グラフでは左から右への時系列の読み順と一致させる。",
    },
    {
      term: "animation-fill-mode: both",
      desc: "遅延中は最初のキーフレーム、終了後は最後のキーフレームの状態を保つ指定。これが無いと遅延中のバーが最終の高さで見えてしまう。",
    },
    {
      term: "clip-path: inset()",
      desc: "要素を内側に切り抜く指定。round で角丸も保てるので、scaleYのように角丸が縦に潰れない。",
    },
  ],
  related: ["counter", "stagger-grid", "equalizer-bars", "circular-progress"],
};
