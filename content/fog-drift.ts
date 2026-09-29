import type { MotionEntry } from "@/lib/types";

export const fogDrift: MotionEntry = {
  slug: "fog-drift",
  category: "media",
  nameJa: "霧のドリフト",
  nameEn: "fog drift / drifting fog / layered mist animation",
  lede: "半透明の霧を2〜3枚重ね、互いに逆向き・互いに割り切れない周期でゆっくり流す背景演出。1枚だけだと「画像が横に滑っている」としか見えないが、層どうしがすれ違った瞬間に奥行きと空気が生まれる。周期を揃えないことと、上下の縁をマスクで溶かすことが要。",
  params: [
    {
      key: "duration",
      label: "duration(手前の層の片道 s)",
      min: 6,
      max: 80,
      step: 1,
      default: 14,
      desc: "実案件の背景なら40〜70sが適正域(動いていると気づくのに数秒かかる速さ)。デモは動きを見せるため短め。20sを切ると霧ではなく煙や雲の早回しに見える。",
    },
    {
      key: "travel",
      label: "travel(横に流れる幅 %)",
      min: 2,
      max: 24,
      step: 1,
      default: 10,
      desc: "層の幅に対する片道の移動量。8〜12%が自然。20%を超えると層の端が見えやすくなるので、層を枠の150%以上に広げておく。",
    },
    {
      key: "layers",
      label: "layers(霧の層の数)",
      min: 1,
      max: 4,
      step: 1,
      default: 3,
      desc: "2〜3層が定番。1層だと奥行きが出ず、4層を超えると白く濁って背景のコントラストが消える。奥の層ほど薄く・遅くする。",
    },
    {
      key: "density",
      label: "density(霧の濃さ)",
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.55,
      desc: "手前の層の不透明度。0.4〜0.6が目安。奥の層はこれに0.8倍・0.55倍…と減衰させる。0.8を超えると霧ではなく白い帯に見える。",
    },
  ],
  promptTemplate: `ヒーロー下部に fog drift(漂う霧)を実装してください。

- 霧を置く帯(fog bank)を position:absolute で下部に敷き、overflow: clip と pointer-events: none を付ける。コンテンツより奥の z-index に置く
- 帯には mask-image: linear-gradient(transparent, #000 24%, #000 70%, transparent) をかけ、上下の縁を溶かす(ハードエッジが残ると霧ではなく画像の帯に見える)
- 帯の中に霧の層を {{layers}} 枚重ねる。各層は帯より左右に大きく(inset: -8% -30% 程度)取り、流しても端が見えないようにする
- 霧のテクスチャは1種類でよい。偶数番目の層は scaleX(-1) で左右反転して使い回し、同じ模様が並んで見えるのを防ぐ
- 手前の層は {{duration}}s で片道、ease-in-out・alternate・infinite で往復させる。移動は translate3d(-{{travel}}%, 4%, 0) scale(1.04) → 途中で少し上下とscaleを揺らし → translate3d({{travel}}%, 2%, 0) scale(1.03)
- 2枚目は逆向きに流す。周期は手前の約1.4倍・1.75倍…と「割り切れない比」にずらし、animation-delay を負の値にして開始位相もばらす(揃えると数十秒おきに全層が同期して、1枚の画像が動いているように見える)
- 不透明度は手前を {{density}} とし、奥の層ほど0.8倍・0.55倍と減衰させる
- 動かすのは transform だけ(background-position や left をアニメーションさせない)
- IntersectionObserver で帯が画面外にあるときは animation-play-state: paused にする(長周期のループを見えないところで回し続けない)
- prefers-reduced-motion 時はアニメーションを止め、霧は静止した層としてだけ残す`,
  ngExample: {
    say: "「背景に霧っぽい雰囲気を足して」",
    why: "霧の画像1枚を background-position で左右に流すだけの実装が返りやすい。層が1枚なので奥行きが出ず、周期も短く、端が切れた帯が横に滑る「スライドショーの早送り」になる。濃さの指定がないと白く濁って見出しの可読性を削る。",
  },
  okExample: {
    say: "「fog driftを実装。下部の帯に霧を3層、上下はmaskで溶かす。手前は片道40s・幅10%をalternateで往復、2層目は逆向き56s、3層目70s、負のdelayで位相をばらす。不透明度0.53/0.43/0.29、transformのみ、画面外でpaused、reduced-motionは静止」",
    why: "層の数・逆向き・割り切れない周期・負のdelayまで指定しているので、層どうしがすれ違い続けて「同期して1枚に見える」瞬間が来ない。縁のマスクと画面外での一時停止も最初から入る。",
  },
  vocab: [
    {
      term: "counter-drift",
      desc: "隣り合う層を逆向きに流すこと。速度差だけのパララックスより少ない移動量で、層どうしがすれ違う奥行きが出る。",
    },
    {
      term: "割り切れない周期",
      desc: "40s / 56s / 70s のように公倍数が大きい周期を組むこと。全層が同じ位置に戻る瞬間が数十分に1度になり、ループの継ぎ目が知覚されない。",
    },
    {
      term: "負の animation-delay",
      desc: "delayにマイナスを入れると、アニメーションが途中から始まる。読み込み直後から各層がばらばらの位置にいる状態を作れる。",
    },
    {
      term: "animation-direction: alternate",
      desc: "往路と復路を交互に再生する指定。霧の模様は端でつながらないので、無限スクロールではなく往復にするとテクスチャの継ぎ目を作らずに済む。",
    },
    {
      term: "mask-image",
      desc: "グラデーションで要素の見え方を削る指定。霧の帯の上下を透明に落とし、画像の縁を消して空気に溶け込ませる。",
    },
    {
      term: "animation-play-state",
      desc: "アニメーションの一時停止/再開を切り替えるプロパティ。IntersectionObserverと組み、画面外の長周期ループを止める。",
    },
  ],
  related: ["god-rays", "grain-overlay", "parallax", "ambient-float"],
};
