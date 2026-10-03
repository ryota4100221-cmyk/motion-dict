import type { MotionEntry } from "@/lib/types";

export const scrollCue: MotionEntry = {
  slug: "scroll-cue",
  category: "ui",
  nameJa: "スクロールキュー（マウス型のスクロール誘導）",
  nameEn: "scroll cue / scroll down indicator / mouse scroll icon",
  lede: "ファーストビューの下端に置いたマウスの輪郭の中で、ホイールに見立てた小さな粒が下へ流れては消え、上に戻ってまた現れる。往復させずに「一方向に流して消す」ことで、揺れではなく「下へ回す」という操作そのものを絵で示すのが肝。",
  params: [
    {
      key: "travel",
      label: "travel(粒が下る距離 px)",
      min: 4,
      max: 24,
      step: 1,
      default: 12,
      desc: "マウス枠の高さの25〜35%が目安(高さ40pxの枠なら10〜14px)。枠の下端まで届かせると、粒が枠からはみ出して見える。",
    },
    {
      key: "duration",
      label: "duration(1周の時間 s)",
      min: 1,
      max: 4,
      step: 0.1,
      default: 2.4,
      desc: "実測の相場は2.2〜2.4s。1.5sを切ると急かされている印象になり、3sを超えると止まっているように見える。",
    },
    {
      key: "share",
      label: "share(1周のうち下って消えるまでの割合 %)",
      min: 20,
      max: 75,
      step: 5,
      default: 45,
      desc: "45%前後が定番(下って消える→一瞬で上へ戻る→約20%かけて現れる→静止)。大きくすると静止がなくなり、流れっぱなしの帯に見える。",
    },
    {
      key: "nudge",
      label: "nudge(マウス本体の沈み込み px)",
      min: 0,
      max: 12,
      step: 1,
      default: 4,
      desc: "粒と同じ周期で枠ごと少し沈める量。0なら枠は静止。8pxを超えると粒より枠の動きが目立ち、案内の主役が入れ替わる。",
    },
  ],
  promptTemplate: `ファーストビューの下端中央に scroll cue(マウス型のスクロール誘導)を実装してください。

- 角丸の縦長の枠(マウスの輪郭)の中に、ホイールに見立てた小さな粒(幅2px・高さ6px程度)を上寄りに置く
- 1周 {{duration}}s。最初の {{share}}% で粒を translateY(0)→translateY({{travel}}px) へ ease-out で下げながら、opacity 1→0・scaleY 1→0.5 で縮めて消す
- 消えた直後(+1%)に粒を translateY(0) へ瞬間的に戻し、そこから約20%かけて opacity 0→1 で現れさせ、残りは静止させる(往復させない。戻る動きを見せると「下へ回す」に見えない)
- 同じ周期で枠ごと translateY({{nudge}}px) だけ沈めて戻す(粒が消えるのと同じタイミングで最深に。0なら枠は動かさない)
- 区間の割合を数値で変えられるよう、keyframes は Web Animations API(element.animate の offset 指定)で組んでもよい
- top や margin ではなく transform と opacity で動かす(リフローさせない)
- ページが少しでもスクロールされたらキューはフェードアウトさせて役目を終える。クリックで次のセクションへスクロールさせるなら <button> にして aria-label を付ける
- prefers-reduced-motion 時は粒を動かさず、枠と粒と「SCROLL」のラベルを静止表示して意味だけ残す`,
  ngExample: {
    say: "「ファーストビューに下へスクロールを促すアニメーションを付けて」",
    why: "何を動かすかが決まらない。下向き矢印が上下にバウンスし続ける実装(=hint nudge系)が返ってくることが多く、粒が流れて消えるマウス型にはならない。周期も休止も無く、延々と跳ね続ける。",
  },
  okExample: {
    say: "「scroll cueを。マウス枠の中の粒を2.4s周期で、最初の45%でtranslateY 12pxまで下げつつopacity 0・scaleY 0.5に、直後に上へ瞬間的に戻して20%かけてフェードイン、残りは静止。枠は同周期で4px沈む。スクロールされたら消す。reduced-motionでは静止表示」",
    why: "距離・周期・区間の割合・枠の動き・消える条件が揃っている。特に「上へは瞬間的に戻す」の指定が、往復の揺れではなく一方向の流れ=ホイールを回す絵にする。",
  },
  vocab: [
    {
      term: "スクロールキュー(scroll cue)",
      desc: "ファーストビューに「この下に続きがある」と示す小さな案内。マウス型・下向き矢印・縦線の上を点が走る型などがある。",
    },
    {
      term: "ホイール(wheel)の粒",
      desc: "マウスの中のホイールを点や短い線で表したもの。これが下へ流れることで「回す」操作を表す。",
    },
    {
      term: "瞬間リセット",
      desc: "消えた直後に元の位置へ補間なしで戻すこと。keyframes では 45%→46% のように隣接した2点を置いて作る。",
    },
    {
      term: "オフセット(offset)",
      desc: "Web Animations API でキーフレームを置く位置(0〜1)。CSSの@keyframesの%と同じだが、JSから数値で変えられる。",
    },
    {
      term: "フォールド(the fold)",
      desc: "最初の画面で見える範囲の下端。キューはこの境目の真上に置き、スクロールが始まったら消す。",
    },
  ],
  related: ["hint-nudge", "scroll-progress", "gesture-hint"],
};
