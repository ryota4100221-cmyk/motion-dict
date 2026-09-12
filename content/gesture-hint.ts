import type { MotionEntry } from "@/lib/types";

export const gestureHint: MotionEntry = {
  slug: "gesture-hint",
  category: "ui",
  nameJa: "ジェスチャーヒント（手の実演）",
  nameEn: "gesture hint / animated hand coach mark / swipe hint",
  lede: "手のアイコンが「掴んで、動かして、離す」を目の前で演じ、操作方法を文字なしで教えるオンボーディング演出。移動そのものより、握る・離すの形の切り替えが「これはドラッグだ」を伝える。",
  params: [
    {
      key: "gesture",
      label: "gesture(実演する操作)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["drag", "tap"],
      desc: "drag＝握って横に運ぶ。tap＝指で押して波紋を出す。教えたい操作と一致させる。",
    },
    {
      key: "duration",
      label: "duration(1周の時間 s)",
      min: 1.8,
      max: 6,
      step: 0.1,
      default: 3,
      desc: "構え→操作→離す→戻る で1周。2.6〜4sが読みやすい。2s未満は手の形の切り替えが見えない。",
    },
    {
      key: "distance",
      label: "distance(ドラッグの移動量 px)",
      min: 60,
      max: 260,
      step: 10,
      default: 180,
      desc: "drag時に手が運ぶ距離。対象の幅の半分〜2/3が目安。短すぎると「押す」と誤読される。",
    },
    {
      key: "press",
      label: "press(握り込みの縮小率)",
      min: 0.7,
      max: 1,
      step: 0.02,
      default: 0.86,
      desc: "掴んだ・押した瞬間に手を縮める率。0.85前後で「力が入った」と読める。1だと形の差し替えだけになる。",
    },
  ],
  promptTemplate: `横スクロールのギャラリーに gesture hint(手のアイコンで操作を実演するオンボーディングアニメーション)を実装してください。

- 実演する操作は {{gesture}}(drag=開いた手→握った手に差し替えて横へ運ぶ / tap=指差しの手で押して波紋を出す)
- 1周は {{duration}}s の無限ループ。「構えて静止 → 握る(押す) → 操作 → 離す → 見えない所で初期位置に戻る」の順
- drag のときは手を translateX で {{distance}}px 運ぶ。運ぶ区間だけ cubic-bezier(0.4, 0, 0.2, 1) で加減速する
- 手の形(開く/握る/指差し)は別々のSVGを重ね、opacity を steps(1) / step-end で瞬時に差し替える(クロスフェードさせない)
- 握った・押した瞬間に手を scale({{press}}) に縮め、離したら 1 に戻す
- 初期位置へ戻る区間は opacity 0 にして、手が逆走するところを見せない
- 位置は left/top ではなく transform で動かし、手のレイヤーは pointer-events: none にして下の操作を邪魔しない
- ユーザーが実際にギャラリーを触ったらヒントは役目を終えるのでフェードアウトして止め、localStorage に既読を保存して次回以降は出さない
- prefers-reduced-motion 時はループさせず、開いた手を構えの位置に静止表示し、操作名のテキストを添えて意味だけ残す`,
  ngExample: {
    say: "「ドラッグできることが分かるように手のアニメーションを出して」",
    why: "手の形を切り替える指定が無いので、同じ指差しアイコンが左右に滑るだけの実装が返ってくる。それはドラッグにもスワイプにもホバーにも見え、戻りの逆走まで見えて「左右に振れ」と誤読される。",
  },
  okExample: {
    say: "「gesture hint を drag で。3s ループ、開いた手で構え→step-endで握った手に差し替えつつscale(0.86)→translateXで180px運ぶ→離す→opacity 0 で初期位置へ戻す。ギャラリーを触ったら止めて既読保存。reduced-motionは静止の手＋テキスト」",
    why: "手の形の差し替え方式(step-end)・握り込みの縮小・運ぶ距離・戻りを隠す指定・停止条件が揃っている。特に「形は瞬時に差し替える」「戻りは見せない」の2点が、ただ往復する手と実演する手を分ける。",
  },
  vocab: [
    {
      term: "コーチマーク(coach mark)",
      desc: "初回だけ画面に重ねて操作方法を教える案内レイヤー。手のアニメーションはその中でも文字を読ませずに済む型。",
    },
    {
      term: "ポーズ差し替え",
      desc: "開いた手・握った手・指差しの手を別画像で重ね、opacityを瞬時に切り替えること。補間しないのでコマ送り的に「形が変わった」と読める。",
    },
    {
      term: "step-end",
      desc: "キーフレーム間を補間せず、区間の終わりで値を飛ばすタイミング関数。ポーズ差し替えや表示の出し入れに使う。",
    },
    {
      term: "リターンの隠蔽",
      desc: "ループで初期位置に戻る区間を透明にしておくこと。戻りが見えると、教えたい操作の逆方向まで実演してしまう。",
    },
  ],
  related: ["hint-nudge", "drag-scroll", "ripple-tap", "pulse-ring"],
};
