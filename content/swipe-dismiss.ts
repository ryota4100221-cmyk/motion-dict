import type { MotionEntry } from "@/lib/types";

export const swipeDismiss: MotionEntry = {
  slug: "swipe-dismiss",
  category: "ui",
  nameJa: "スワイプディスミス（払って消す）",
  nameEn: "swipe to dismiss / swipe away / drag to dismiss",
  lede: "カードや通知を横へ払うと消え、払いきれなければ元の位置へ戻る操作。肝は「指に1:1で追従する区間」と「離した瞬間のしきい値判定」を分けて設計することで、距離が足りなくても速ければ消す二重判定が入ると一気に手触りが良くなる。",
  params: [
    {
      key: "threshold",
      label: "threshold(消えるまでの距離 px)",
      min: 20,
      max: 160,
      step: 5,
      default: 45,
      desc: "ここを越えて離すと消える。45〜60pxが実測の定番で、120pxを超えると「重い・消えない」と感じられる。20px以下は誤爆する。",
    },
    {
      key: "fling",
      label: "fling(速度で消す境界 px/s)",
      min: 0,
      max: 1200,
      step: 10,
      default: 110,
      desc: "距離が足りなくてもこの速さ以上なら消す。110〜400px/sが自然。0にすると少しでも動かせば消えるので誤爆する。",
    },
    {
      key: "flyout",
      label: "flyout(飛び去る時間 s)",
      min: 0.1,
      max: 0.8,
      step: 0.05,
      default: 0.2,
      desc: "判定が通ってから画面外へ抜けるまで。0.15〜0.25sのease-outが「指の勢いの続き」に見える。0.5s超は操作が終わった後に待たされる。",
    },
    {
      key: "snapBack",
      label: "snapBack(戻る時間 s)",
      min: 0.1,
      max: 0.9,
      step: 0.05,
      default: 0.4,
      desc: "しきい値に届かなかったときに元へ戻る時間。飛び去りより長くする(0.35〜0.5s)と「戻された」が読めて、消えたときとの差が付く。",
    },
  ],
  promptTemplate: `カードに swipe to dismiss を実装してください。

- pointerdown/pointermove/pointerup で扱い、pointerdown時に setPointerCapture する
- ドラッグ中はカードを transform: translateX(dx) で指に1:1追従させ、transitionは切る
- 追従中の付加表現: rotate は dx/{{threshold}} * 6deg(上限6deg)、opacity は 1 - 0.28 * min(1, |dx|/{{threshold}}) まで落とす
- 離した時の判定は二重にする: |dx| >= {{threshold}}px、または直前80msの速度が {{fling}}px/s 超
- 判定が通ったら translateX(dx ± カード幅+80px) と opacity 0 まで {{flyout}}s ease-out で飛ばし、終了後にリストから外す
- 通らなかったら translateX(0) へ {{snapBack}}s ease-out で戻す
- 速度は「ドラッグ全体の平均」ではなく直近80msの移動量から出す(途中で止めてから離したのに飛ぶ誤作動を防ぐ)
- 消せない方向へ引いたときは d * 1/(1.5 + |d|/20) のゴムバンド減衰をかけて「動くが進まない」を返す
- カードには touch-action: none と user-select: none を当て、left/top ではなく transform だけで動かす
- 消した後は Undo 可能なトーストを出し、キーボード操作のために Delete キー相当の代替手段も用意する
- prefers-reduced-motion 時は追従と飛び去りのアニメーションを省き、判定が通った瞬間に即座に消す(戻るときも即座に戻す)`,
  ngExample: {
    say: "「カードをスワイプで消せるようにして」",
    why: "しきい値が決まらないので「少しでも動かすと消える」誤爆だらけの実装か、逆に画面端まで引かないと消えない実装が返ってくる。速い一払いで消えない(速度判定が無い)のが特に多く、指に追従せずクリック扱いで消すだけの版も来る。",
  },
  okExample: {
    say: "「swipe to dismissを実装。pointermoveでtranslateX(dx)に1:1追従＋rotateは最大6deg。離したら|dx|>=45pxか直近80msの速度>110px/sで判定し、通れば0.2s ease-outで幅+80px先へ飛ばしてopacity 0、通らなければ0.4sで0へ戻す。transformのみ、reduced-motionでは即時」",
    why: "追従区間・判定・飛び去り・戻りの4区間を分けて数値で指定している。「直近80msの速度」と「距離OR速度の二重判定」を書いた点が効いていて、この1行が有る無しで手触りが変わる。",
  },
  vocab: [
    {
      term: "dismiss threshold",
      desc: "離した位置が消える側か戻る側かを分ける距離。px固定かカード幅の割合(25〜40%)で決める。",
    },
    {
      term: "fling / velocity threshold",
      desc: "速度による消しの判定。短く速い一払いを拾うための第二の入口で、距離判定とORで繋ぐ。",
    },
    {
      term: "snap back",
      desc: "しきい値に届かず元の位置へ戻る動き。「操作は受け付けたが実行はしていない」を返す返事。",
    },
    {
      term: "rubber banding",
      desc: "消せない方向へ引いたときに減衰をかけて追従を鈍らせる手法。1/(1.5+|d|/20)のような減衰率を掛ける。",
    },
    {
      term: "setPointerCapture",
      desc: "ドラッグ開始時にポインタを要素へ固定する。指がカードの外へ出ても pointermove が届き続ける。",
    },
    {
      term: "touch-action: none",
      desc: "ブラウザ既定のスクロール・ズームを止めて横ドラッグを自分で扱う宣言。これが無いとスマホで追従が奪われる。",
    },
  ],
  related: ["toast-slide", "drop-zone", "rubber-band"],
};
