import type { MotionEntry } from "@/lib/types";

export const stepper: MotionEntry = {
  slug: "stepper",
  category: "ui",
  nameJa: "ステッパー",
  nameEn: "stepper / progress steps",
  lede: "申込みフローやオンボーディングで「今どの段階か」を示す、丸ノードと連結線の進捗UI。次に進むたびに連結線が満ちて次ノードが活性化する。線の伸びとノードの拡大を分けて動かすのが肝。",
  params: [
    {
      key: "duration",
      label: "duration(1段階進む時間 s)",
      min: 0.2,
      max: 1,
      step: 0.05,
      default: 0.45,
      desc: "連結線が満ちてノードが活性化するまでの時間。0.3〜0.5sが目安。段階移動は待たせたくないので0.7sを超えるともたつく。",
    },
    {
      key: "nodeScale",
      label: "nodeScale(現在ノードの拡大)",
      min: 1,
      max: 1.5,
      step: 0.05,
      default: 1.2,
      desc: "到達した現在ノードをどれだけ大きく見せるか。1.15〜1.25倍が自然。完了済みノードは1に戻す。",
    },
    {
      key: "easing",
      label: "easing(進む時のイージング)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["ease-out", "ease-in-out", "back(行き過ぎて戻る)"],
      desc: "連結線の伸びとノード拡大の緩急。backは活性化の瞬間に軽く弾む。",
    },
  ],
  promptTemplate: `フォームの進捗表示に stepper(段階プログレス)を実装してください。

- 丸ノードを横一列に並べ、隣り合うノードの間を連結線でつなぐ
- 状態は「現在の段階index」1つで持ち、ノードは index を境に「完了 / 現在 / 未到達」の3状態に分ける
- 次へ進んだら、通過した連結線を transform: scaleX(0→1)・transform-origin: left で {{duration}}s 満たす(width のアニメーションは使わずリフローさせない)
- 現在ノードは transform: scale({{nodeScale}}) で強調し、完了済みノードは scale(1) に戻す
- 連結線の伸びとノードの拡大は別要素・別transformに分け、重ねて同時に動かす
- イージングは {{easing}} を使う("back(行き過ぎて戻る)"の場合は cubic-bezier(0.34, 1.56, 0.64, 1) で活性化を軽く弾ませる)
- 戻る操作でも同じ規則で連結線を scaleX(1→0) に戻す
- prefers-reduced-motion 時は伸縮・拡大アニメーションをやめ、色だけで完了/現在/未到達を即時に切り替える`,
  ngExample: {
    say: "「申込みの進捗バーをステップ表示にして」",
    why: "「バー」と言うと1本のプログレスバー実装になりがちで、ノードと連結線の段階UIにならない。移動のたびに width や連結線の色をパッと切り替えるだけの、動きのない実装が返ることも多い。",
  },
  okExample: {
    say: "「stepperを丸ノード＋連結線で実装。進んだら通過線を scaleX(0→1)・origin leftで0.45s満たし、現在ノードは scale(1.2)で強調、完了ノードは1に戻す。線とノードは別transform。widthアニメ禁止・reduced-motionは色だけ切替」",
    why: "「1本バーではなくノード＋線」「線とノードを分けて動かす」「transformで伸ばす」まで指定できている。3状態(完了/現在/未到達)を明示すると、色と動きの割り当てがぶれない。",
  },
  vocab: [
    {
      term: "ステップノード",
      desc: "各段階を表す丸。完了・現在・未到達の3状態を色と大きさで区別する。",
    },
    {
      term: "コネクター",
      desc: "ノード間をつなぐ線。通過した区間だけ scaleX で満たし、進捗を線の長さで見せる。",
    },
    {
      term: "transform-origin",
      desc: "連結線を伸ばす起点。左端(left)にすると前のノード側から次のノードへ向かって満ちる。",
    },
    {
      term: "3状態モデル",
      desc: "現在index を境にした 完了/現在/未到達 の分け方。状態を1つの数値で持つと戻る操作も同じ規則で書ける。",
    },
  ],
  related: ["tab-indicator", "loading-bar", "scroll-spy"],
};
