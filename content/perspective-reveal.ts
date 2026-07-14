import type { MotionEntry } from "@/lib/types";

export const perspectiveReveal: MotionEntry = {
  slug: "perspective-reveal",
  category: "scroll",
  nameJa: "3D起き上がりリビール",
  nameEn: "perspective reveal / 3D tilt-up reveal",
  lede: "画面に入った要素が、奥に寝かせた状態(rotateX)から床を軸に起き上がって現れる動き。2Dのfade/slideより奥行きとドラマが出る、シネマティックなスクロールサイトの定番リビール。",
  params: [
    {
      key: "perspective",
      label: "perspective(遠近の強さ px)",
      min: 400,
      max: 1600,
      step: 100,
      default: 900,
      desc: "小さいほどパースが強く歪む。600〜1000pxが自然。1600pxに近づくとほぼ平面的な回転になる。",
    },
    {
      key: "rotateX",
      label: "rotateX(寝かせる角度 deg)",
      min: 15,
      max: 75,
      step: 5,
      default: 50,
      desc: "開始時に手前へ倒す角度。40〜55°が奥行きと可読性のバランス点。75°は真横近くまで倒れて派手だがやり過ぎに見えやすい。",
    },
    {
      key: "duration",
      label: "duration(起き上がる時間 s)",
      min: 0.3,
      max: 1.5,
      step: 0.05,
      default: 0.7,
      desc: "0.6〜0.8sがゆったり上品。0.4s以下は機敏だが奥行きの余韻が消える。",
    },
    {
      key: "stagger",
      label: "stagger(カード間の時間差 ms)",
      min: 0,
      max: 200,
      step: 10,
      default: 80,
      desc: "リストで後の要素ほど遅らせる量。60〜100msでカードを配るリズムが出る。0だと一斉に起き上がり順序感が消える。",
    },
  ],
  promptTemplate: `スクロールで現れる要素に perspective reveal(3D起き上がりリビール)を実装してください。

- 親要素に perspective: {{perspective}}px を掛け、子要素の transform-origin を center bottom にする
- 各要素は rotateX({{rotateX}}deg)・opacity 0・少し下(translateY 40px程度)の状態から、rotateX(0)・opacity 1・translateY(0) へ {{duration}}s かけて起き上がる
- イージングは cubic-bezier(0.22, 1, 0.36, 1) のような強めの ease-out
- 発火は IntersectionObserver(または ScrollTrigger)で、要素がビューポート下端から15%ほど入った時点で1回だけ。出っぱなしにする
- リストは要素ごとに {{stagger}}ms ずつ遅延をずらし、手前から奥へ配るように見せる
- 動かすのは transform と opacity のみ。top/height/margin は触らずリフローさせない
- prefers-reduced-motion 時は回転を行わず、全要素を rotateX(0)・opacity 1 で即表示する`,
  ngExample: {
    say: "「カードがパタッと立ち上がる感じで出てきて」",
    why: "「パタッ」だけでは倒す角度・遠近の強さ・起き上がる速度が未定義。perspective指定を忘れて回転が平面的に潰れたり、単なるfade-inが返ってきたりしやすい。",
  },
  okExample: {
    say: "「perspective revealを実装。親にperspective 900px、子はtransform-origin bottomでrotateX 50°→0・opacity 0→1・translateY 40px→0を0.7s ease-outで。IntersectionObserverで1回発火、リストはstagger 80ms。transformのみでリフロー禁止」",
    why: "遠近・角度・軸・移動量・速度・発火条件・時間差まで数値で指定している。特に『親にperspective』『transform-origin bottom』の2点が、起き上がって見えるか平面的に回るだけかを分ける。",
  },
  vocab: [
    {
      term: "perspective",
      desc: "3D変形の遠近感を決めるプロパティ。親に指定すると子のrotateXが奥行きを持って見える。値が小さいほどパースが強い。",
    },
    {
      term: "rotateX",
      desc: "横軸まわりの回転。正の角度で上端が奥へ倒れ、0へ戻すと手前に起き上がる。この動きの主役。",
    },
    {
      term: "transform-origin",
      desc: "変形の基準点。center bottom にすると下辺を軸に「床から起き上がる」挙動になる。centerだと手前に倒れ込むだけになる。",
    },
    {
      term: "stagger",
      desc: "複数要素の開始を一定間隔ずつ遅らせること。カードを1枚ずつ配るリズムはここで生まれる。",
    },
  ],
  related: ["scroll-fade-in", "clip-reveal", "flip-card"],
};
