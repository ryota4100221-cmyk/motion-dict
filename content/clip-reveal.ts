import type { MotionEntry } from "@/lib/types";

export const clipReveal: MotionEntry = {
  slug: "clip-reveal",
  category: "media",
  nameJa: "クリップリビール",
  nameEn: "clip-path reveal / image reveal",
  lede: "clip-path: inset()で隠した画像を、指定方向へ切り開いて見せるリビール演出。動くのはマスクだけで画像自体は動かないため、切れ味のある「現れ方」になる。スクロールに合わせた画像の登場演出の定番。",
  params: [
    {
      key: "duration",
      label: "duration(リビール時間 s)",
      min: 0.3,
      max: 2,
      step: 0.05,
      default: 0.9,
      desc: "0.8〜1.2sが見せ場向き。expo系easingなら長めでも間延びしない。",
    },
    {
      key: "direction",
      label: "direction(現れる方向)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["left", "up", "center"],
      desc: "leftは左端から右へ、upは下端から上へ、centerは中心から四方へ開く。",
    },
  ],
  promptTemplate: `画像の表示に clip-path reveal を実装してください。

- 初期状態はclip-pathで全隠しにする(左から: inset(0 100% 0 0) / 下から上: inset(100% 0 0 0) / 中心から: inset(50%))
- 表示トリガーで clip-path: inset(0) へ {{duration}}s かけて開く。方向は {{direction}}
- easingはease-outではなく cubic-bezier(0.16, 1, 0.3, 1)(easeOutExpo系)を使う
- 画像自体はtransformで動かさない(マスクだけが動く)。動かす場合も逆方向へ10%までに抑える
- 一度表示したら開いたまま維持する(スクロールで戻っても再生し直さない)
- prefers-reduced-motion 時はクリップなしで即座に表示する`,
  ngExample: {
    say: "「画像をシュッと表示させて」",
    why: "「シュッ」がフェードなのかスライドなのかマスクなのか決まらない。opacityだけの平凡なフェードインや、画像ごと移動してレイアウトが揺れる実装になりがち。",
  },
  okExample: {
    say: "「clip-path revealを実装。inset(0 100% 0 0)→inset(0)を0.9s、cubic-bezier(0.16,1,0.3,1)。画像は動かさずマスクのみ。一度開いたら維持」",
    why: "初期値・終了値・時間・easing・再生ポリシーがすべてある。inset()の値そのものを書けば、方向の解釈違いが起きようがない。",
  },
  vocab: [
    {
      term: "clip-path: inset()",
      desc: "上・右・下・左の内側オフセットで矩形マスクを作る関数。この値をアニメーションさせると「切り開く」動きになる。",
    },
    {
      term: "リビール",
      desc: "隠していたものを演出付きで見せる手法の総称。マスク・カーテン・ワイプはすべてこの仲間で、方向と速度が性格を決める。",
    },
    {
      term: "easeOutExpo",
      desc: "冒頭が速く終端で急減速するイージング。cubic-bezier(0.16, 1, 0.3, 1)が定番で、リビールの「スッ…ピタッ」という切れ味を作る。",
    },
    {
      term: "カウンターモーション",
      desc: "マスクの動きと逆方向へ画像を少しだけ動かす技。奥行きが出るが、量が多いと酔うので10%以内に抑える。",
    },
  ],
  related: ["curtain-wipe", "image-zoom-hover", "split-text-reveal"],
};
