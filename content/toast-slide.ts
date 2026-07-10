import type { MotionEntry } from "@/lib/types";

export const toastSlide: MotionEntry = {
  slug: "toast-slide",
  category: "ui",
  nameJa: "トースト通知",
  nameEn: "toast notification / snackbar",
  lede: "画面端からスッと現れ、数秒で自動的に消える通知。入りは減速(ease-out)で素早く、出は加速(ease-in)で静かに退場させる非対称設計が肝。複数積まれたときの詰め直しまで動かすと完成度が跳ねる。",
  params: [
    {
      key: "duration",
      label: "duration(スライド時間 s)",
      min: 0.15,
      max: 1.0,
      step: 0.05,
      default: 0.35,
      desc: "入りのスライド時間。0.25〜0.4sが快適。通知は「速く出て静かに消える」が基本。",
    },
    {
      key: "hold",
      label: "hold(表示時間 s)",
      min: 1,
      max: 8,
      step: 0.5,
      default: 3,
      desc: "自動で消えるまでの時間。一言の通知で3s前後、読ませる文なら5s。1s台は読み終わる前に消える。",
    },
  ],
  promptTemplate: `トースト通知(スナックバー)を実装してください。

- トーストは画面右下に固定し、画面外(translateX(120%))から {{duration}}s でスライドインさせる。イージングは ease-out(例: cubic-bezier(0.22, 1, 0.36, 1))
- 表示から {{hold}}s 経ったら自動で退場させる。出は入りと非対称に、ease-in で画面外へ滑らせながら opacity 0 へフェードする
- 複数のトーストはスタックさせ、1つ消えたら残りを transform の transition で滑らかに詰め直す(topやmarginをアニメーションさせない)
- 動かすのは transform と opacity のみ。リフローを起こさない
- prefers-reduced-motion 時はスライドさせず、opacityのフェードのみで出し入れする`,
  ngExample: {
    say: "「通知をアニメーションで出るようにして」",
    why: "位置も消えるタイミングも決まらない。入りと出が同じイージングのまま返ってきて機械的な印象になりがちで、複数表示の挙動が未定義のままトースト同士が重なるバグも起きやすい。",
  },
  okExample: {
    say: "「トーストを右下からtranslateXでスライドイン、0.35s ease-out。3s後にease-in+opacityフェードで退場。スタック時の詰め直しはtransformのtransitionで」",
    why: "入りと出の非対称・自動消去の秒数・スタックの詰め直し方式まで指定。「transformのみ」の一言でリフローしない実装が担保される。",
  },
  vocab: [
    {
      term: "toast / snackbar",
      desc: "画面端に出る一時通知の呼び名。Android圏はsnackbar、Web一般はtoastで通じる。",
    },
    {
      term: "in-out非対称",
      desc: "入りはease-outで素早く、出はease-inで静かに。UI要素の出入りはイージングを変えるのが原則。",
    },
    {
      term: "auto dismiss",
      desc: "一定時間後の自動消去。hold(表示時間)とセットで秒数を指定する。",
    },
    {
      term: "stacking",
      desc: "複数トーストの積み上げ。1つ消えた後の詰め直しをどう動かすかまで含めて指定する。",
    },
  ],
  related: ["tooltip-pop", "menu-reveal"],
};
