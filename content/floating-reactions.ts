import type { MotionEntry } from "@/lib/types";

export const floatingReactions: MotionEntry = {
  slug: "floating-reactions",
  category: "ui",
  nameJa: "フローティングリアクション（湧き上がるアイコン）",
  nameEn: "floating reactions / floating hearts / live reactions",
  lede: "ハートや絵文字が発生点から左右に揺れながら立ちのぼり、上で溶けて消える連続演出。ライブ配信の「いいね」やSNS導線の飾りで使われ、1粒ずつ周期と揺れ幅をずらして群れに見せることが要点である。",
  params: [
    {
      key: "rise",
      label: "rise(上昇距離 px)",
      min: 60,
      max: 260,
      step: 10,
      default: 170,
      desc: "発生点から消えるまでに昇る高さ。アイコン径の6〜10倍が「湧いて抜ける」感じ。小さい飾り（ボタン横など）なら60〜80pxで十分。",
    },
    {
      key: "duration",
      label: "duration(1粒の寿命 s)",
      min: 1.2,
      max: 5,
      step: 0.1,
      default: 3,
      desc: "1粒が昇りきるまでの時間。2.5〜3.5sがふわっと漂う速さ。1.5sを切ると「噴き出す」勢いになり、ライブの盛り上がり表現向き。",
    },
    {
      key: "sway",
      label: "sway(左右の揺れ幅 px)",
      min: 0,
      max: 40,
      step: 2,
      default: 14,
      desc: "昇りながら左右に振れる幅。10〜20pxで風船や泡のような浮遊感が出る。0だと一直線に昇るだけで機械的に見える。",
    },
    {
      key: "interval",
      label: "interval(自動で湧く間隔 s)",
      min: 0.15,
      max: 1.5,
      step: 0.05,
      default: 0.5,
      desc: "何もしなくても次の1粒が出るまでの間隔。飾り用途は0.8〜1.2s、賑わいを見せるなら0.3〜0.5s。0.2sを切ると画面がうるさくなる。",
    },
  ],
  promptTemplate: `ボタン上に floating reactions(湧き上がるリアクションアイコン)を実装してください。

- {{interval}}s ごとに1粒、ボタンのクリックでは即座に数粒を、発生点(ボタン上端中央)から生成する
- 1粒は2層構造にする。外側の要素は {{duration}}s の ease-out で translateY(0)→translateY(-{{rise}}px) と昇り、出だし12%で scale(0.4→1)・opacity(0→1)、終盤で opacity 0 に溶かす
- 内側の要素は translateX(±{{sway}}px) と rotate(±8deg) を ease-in-out の alternate で往復させ、昇りながら左右に揺らす
- 揺れの周期・負のanimation-delay・発生位置の横ずれ・サイズ・色を粒ごとにランダムにし、群れが揃って見えないようにする
- 位置は必ず transform で動かす(top/left を動かさない=リフロー禁止)
- 昇りきった粒は animationend で DOM から削除し、同時に存在する粒は40個程度で打ち切る
- アイコンは装飾なので aria-hidden にし、pointer-events: none でボタン操作を妨げない
- prefers-reduced-motion 時は粒を飛ばさず、カウンターの数字だけを更新して反応を返す`,
  ngExample: {
    say: "「いいねを押したらハートがふわふわ上がるようにして」",
    why: "昇る距離・寿命・揺れ・発生間隔が決まらない。全粒が同じ軌道・同じ周期で一列に昇る機械的な実装や、top をアニメーションさせるリフロー実装、消えた粒を削除せずDOMに溜め続ける実装が返ってきがち。",
  },
  okExample: {
    say: "「floating reactions をボタン上端から。外側で translateY -170px を3s ease-out、出だしで scale 0.4→1、終盤 opacity 0。内側で translateX ±14px＋rotate ±8deg を alternate で揺らす。周期・delay・横ずれ・色は粒ごとにランダム、0.5sごとに自動で1粒、クリックで数粒。animationend で削除、上限40。reduced-motion時は数字の更新だけ」",
    why: "昇りと揺れを別レイヤーに分けること、粒ごとの乱数、後始末と上限、reduced-motionの代替まで指定。「2層に分ける」の一言で、keyframesを粒ごとに書く重い実装を避けられる。",
  },
  vocab: [
    {
      term: "floating reactions / floating hearts",
      desc: "ライブ配信やビデオ通話で、押されたリアクションが画面端から立ちのぼって消える演出。英語圏ではこの呼び名でそのまま通じる。",
    },
    {
      term: "レイヤー分割(nested transforms)",
      desc: "上昇と左右の揺れを親子2要素に分けて別々のアニメーションで動かすこと。1つの transform に合成するより keyframes が単純で、周期も独立に変えられる。",
    },
    {
      term: "負の animation-delay",
      desc: "delay にマイナス値を入れ、アニメーションを途中から始めること。揺れの位相を粒ごとにずらし、生成直後から群れをばらけさせる。",
    },
    {
      term: "エミッター(emitter)",
      desc: "粒を一定間隔で生み出す発生源。発生間隔・同時数の上限・寿命の3つで画面の賑やかさが決まる。",
    },
  ],
  related: ["confetti-burst", "ambient-float", "press-feedback"],
};
