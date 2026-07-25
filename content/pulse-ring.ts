import type { MotionEntry } from "@/lib/types";

export const pulseRing: MotionEntry = {
  slug: "pulse-ring",
  category: "ui",
  nameJa: "パルスリング",
  nameEn: "pulse ring / radar ping / sonar ping",
  lede: "一点から同心円のリングが次々と拡大しながら消えていく拍動のインジケータ。地図のピンやLIVEバッジなど「ここに注目」を、場所を動かさずに知らせる定番の演出。",
  params: [
    {
      key: "count",
      label: "count(重ねるリングの本数)",
      min: 1,
      max: 4,
      step: 1,
      default: 3,
      desc: "1周期に放つ輪の数。多いほど密なレーダーになる。1本だと単発の波紋、3本前後で途切れない拍動に見える。",
    },
    {
      key: "duration",
      label: "duration(1本が消えるまで s)",
      min: 1,
      max: 4,
      step: 0.2,
      default: 2.4,
      desc: "1本が広がり切って消えるまでの秒数。長いほどゆったり穏やか。1sを切ると忙しなく警告色が強くなる。",
    },
    {
      key: "spread",
      label: "spread(広がる倍率)",
      min: 2,
      max: 6,
      step: 0.5,
      default: 4,
      desc: "輪が最大何倍まで広がるか(コア径に対する倍率)。3〜4倍が自然。大きいほど遠くまで届く印象になる。",
    },
  ],
  promptTemplate: `インジケータ(LIVEバッジ・地図ピン等)に pulse ring(radar ping)を実装してください。

- 中心のコア(点)は動かさず、その背後に同じ位置・同じ大きさのリングを {{count}} 本重ねる
- 各リングは transform: scale(1) から scale({{spread}}) へ広がりながら opacity 1 から 0 でフェードする。これを無限ループさせる
- 1周期({{duration}}s)を本数で割った間隔で animation-delay をずらし、輪が等間隔で放たれ続けるようにする
- イージングは ease-out 系(cubic-bezier(0, 0, 0.2, 1))。広がり始めが速く、外側で減速して消える
- 拡大は width/height や box-shadow ではなく transform: scale で行う(リフローさせない)。リングは aria-hidden の装飾にし pointer-events: none
- prefers-reduced-motion 時はリングの拡大を止め、コアの点(必要なら静止した細いリング1本)だけを表示する`,
  ngExample: {
    say: "「LIVEマークの周りに波紋みたいなのを出して」",
    why: "「波紋みたいな」では本数・広がる倍率・周期が決まらない。1本だけ点滅する実装や、box-shadowを膨らませてリフローさせる重い実装が返ってきやすい。放つ間隔(delay)の指定が抜けると輪が固まって同時に出る。",
  },
  okExample: {
    say: "「pulse ring(radar ping)を実装。コアの背後に同径リングを3本重ね、scale(1)→scale(4)+opacity 1→0を2.4sでループ。周期÷本数でdelayをずらす。ease-out、transformのみ、reduced-motionはコアだけ表示」",
    why: "本数・広がる倍率・周期・放つ間隔・イージング・パフォーマンス制約まで指定している。「transformで広げる」「delayを周期÷本数でずらす」の2点で、重い実装や輪が一斉に出る実装を防げる。",
  },
  vocab: [
    {
      term: "animation-delay",
      desc: "各リングの再生開始をずらす値。周期÷本数にすると輪が等間隔で放たれ、レーダーのように途切れなく見える。",
    },
    {
      term: "ease-out",
      desc: "終わりで減速するイージング。広がり始めを速く、外周で緩めると水面の波紋のように自然になる。",
    },
    {
      term: "opacity fade",
      desc: "拡大に合わせて透明にすること。scaleとopacityはどちらもリフローを起こさずGPUで動くので、多重に重ねても軽い。",
    },
    {
      term: "aria-hidden",
      desc: "装飾のリングを支援技術から隠す属性。意味を持つのはコア(LIVE等のラベル)側だけにし、輪は読み上げさせない。",
    },
  ],
  related: ["dots-pulse", "ripple-tap", "hint-nudge"],
};
