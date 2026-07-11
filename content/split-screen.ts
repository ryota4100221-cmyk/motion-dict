import type { MotionEntry } from "@/lib/types";

export const splitScreen: MotionEntry = {
  slug: "split-screen",
  category: "transition",
  nameJa: "スプリット遷移",
  nameEn: "split screen transition",
  lede: "画面が中央から2枚のパネルに割れ、割れ目から次の画面が現れる遷移。動くのはパネルのtranslateだけで、印象の強さはほぼ「下に次画面を敷く」重なり順の設計で決まる。",
  params: [
    {
      key: "duration",
      label: "duration(割れる時間 s)",
      min: 0.3,
      max: 1.5,
      step: 0.05,
      default: 0.7,
      desc: "0.6〜0.8sが目安。速すぎると割れたことが伝わらず、1sを超えると次画面への到着を待たせる。",
    },
    {
      key: "axis",
      label: "axis(割れる方向)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["vertical", "horizontal"],
      desc: "verticalは上下に割れて横の割れ目、horizontalは左右に割れて縦の割れ目ができる。",
    },
  ],
  promptTemplate: `ページ遷移に split screen transition を実装してください。

- 次のページを下の層に敷き、現在のページを2枚のパネルに分けて上に重ねる
- 割れる方向は {{axis}}(verticalなら上下のパネルをtranslateYで、horizontalなら左右のパネルをtranslateXで逃がす)
- 各パネルは overflow: hidden にし、中に元ページ全体をずらして入れる(継ぎ目で絵が繋がって見えるように)
- パネルは {{duration}}s の cubic-bezier(0.77, 0, 0.175, 1) で ±101% まで動かし、画面外へ完全に出す
- 開き切ったらパネルをDOMから外すか visibility: hidden にする
- top/leftではなくtransformだけで動かす(リフロー禁止)
- prefers-reduced-motion 時はパネルを動かさず、即時切り替えか短いフェードにする`,
  ngExample: {
    say: "「画面が真っ二つに割れて切り替わるやつにして」",
    why: "割れる向きも、割れ目から何が見えるかも未定義。パネルの下に次ページを敷かず割れた後に白背景が見える実装や、パネルに元ページの続きが入っておらず継ぎ目で絵が切れる実装が返ってきがち。",
  },
  okExample: {
    say: "「split screen transitionを実装。現ページを上下2枚のパネルに複製し、下に次ページを敷く。translateYで±101%へ0.7s、cubic-bezier(0.77,0,0.175,1)。transformのみ、reduced-motionは即時切替」",
    why: "重なり順(下に次ページ)・向き・移動量・イージングまで数値で固定。「±101%」の1%が端の見切れを防ぎ、「transformのみ」がリフローするtop/left実装を防ぐ。",
  },
  vocab: [
    {
      term: "z設計(重なり順)",
      desc: "「下に次ページ・上に割れるパネル」という層構造。この遷移の見た目はほぼこの重なり順の設計で決まり、順序を誤ると割れ目から何も見えない。",
    },
    {
      term: "パネル複製",
      desc: "現在のページの見た目を2枚のパネルに分けて持たせる下ごしらえ。各パネルをoverflow: hiddenにして中身をずらすと、継ぎ目で絵が1枚に繋がる。",
    },
    {
      term: "±101%",
      desc: "パネルを画面外へ逃がす移動量。100%ちょうどだと端に1pxの見切れが残ることがあるため、1%足して確実に画面外へ出す。",
    },
    {
      term: "cubic-bezier(0.77, 0, 0.175, 1)",
      desc: "ゆっくり入って一気に抜け、最後に減速するイージング。ページ遷移の「重いものが動く」感覚に合う定番値。",
    },
  ],
  related: ["curtain-wipe", "shutter-transition", "circle-reveal"],
};
