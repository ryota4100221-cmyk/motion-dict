import type { MotionEntry } from "@/lib/types";

export const mosaicReveal: MotionEntry = {
  slug: "mosaic-reveal",
  category: "media",
  nameJa: "モザイクリビール",
  nameEn: "mosaic reveal / tile reveal",
  lede: "画像がタイル状に分割され、1枚ずつ時間差で現れるリビール演出。実装はgridで敷いたカバータイルをopacityで消していくだけと軽い。出現順(ランダム/順番/斜め)とstaggerの設計が世界観を決める。",
  params: [
    {
      key: "tiles",
      label: "tiles(分割数)",
      min: 0,
      max: 3,
      step: 1,
      default: 1,
      options: ["4×3", "6×4", "8×5", "10×6"],
      desc: "タイルの分割数。24〜40枚が目安。少ないと大味、多すぎると砂嵐ノイズに寄る。",
    },
    {
      key: "stagger",
      label: "stagger(1枚ごとの時間差 ms)",
      min: 5,
      max: 60,
      step: 5,
      default: 25,
      desc: "総時間≒最大delay+フェード0.4s。枚数を増やしたらstaggerを削り、全体で1〜1.5sに収める。",
    },
    {
      key: "order",
      label: "order(出現順)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["random", "sequential", "diagonal"],
      desc: "randomはノイズ的、sequentialは走査線的、diagonalは左上から光が走るように見える。",
    },
  ],
  promptTemplate: `画像の出現に mosaic reveal(タイル状リビール)を実装してください。

- 画像の上に CSS grid で {{tiles}} のカバータイル(背景と同色)を敷き詰める
- 各タイルを {{order}} の順に {{stagger}}ms ずつ遅らせ、opacity 1→0 (各0.4s)で消していく
- 出現順はJSでdelay配列を作り、各タイルの transition-delay に流し込む(randomはFisher–Yatesでシャッフル)
- 動かすのはopacityのみ。タイルを動かしたり画像自体を切り抜いたりしない(リフロー禁止)
- 全タイル消滅後はオーバーレイごと display: none にして操作を妨げない
- prefers-reduced-motion 時はタイル分割せず、画像全体を0.3s以内の1回のフェードで表示する`,
  ngExample: {
    say: "「画像をモザイクみたいにパラパラ表示して」",
    why: "分割数も出現順も時間差も未定義。canvasで画像をピクセル分解する過剰実装や、総時間の逆算がなく表示に3秒かかる実装が返ってきがち。",
  },
  okExample: {
    say: "「mosaic revealを実装。6×4のカバータイルをgridで敷き、randomの順に25msずらしてopacity 1→0(各0.4s)。動かすのはopacityのみ、完了後はオーバーレイをdisplay: none。reduced-motionは全体フェード1回」",
    why: "分割数・順序・時間差・後始末まで揃っている。「カバータイルを消す」方式と明示すれば、画像自体を切り刻む重い実装を避けられる。",
  },
  vocab: [
    {
      term: "カバータイル方式",
      desc: "画像を切るのではなく、背景色のタイルを上に敷いて消していく方式。どんなコンテンツにも使え、DOMも軽い。",
    },
    {
      term: "transition-delay",
      desc: "各タイルの開始時刻をずらすCSSプロパティ。JSで作ったdelay配列をstyleに流し込むだけでstaggerが組める。",
    },
    {
      term: "Fisher–Yates",
      desc: "偏りのないシャッフルの定番アルゴリズム。Math.random() - 0.5 でsortする方法は偏るので使わない。",
    },
    {
      term: "総時間の逆算",
      desc: "体感時間 = 最大delay + タイル1枚のフェード時間。枚数×staggerが膨らみやすいので、常に合計から逆算する。",
    },
  ],
  related: ["shutter-transition", "clip-reveal", "blur-load"],
};
