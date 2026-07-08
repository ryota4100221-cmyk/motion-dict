import type { MotionEntry } from "@/lib/types";

export const scrollFadeIn: MotionEntry = {
  slug: "scroll-fade-in",
  category: "scroll",
  nameJa: "スクロールフェードイン",
  nameEn: "scroll fade-in / reveal on scroll",
  lede: "スクロールして画面に入った要素が、下から浮かび上がりながら現れる動き。ほぼすべてのモダンサイトで使われる基本のスクロール演出で、まずこれを正しく指示できると全体の品質が一段上がる。",
  params: [
    {
      key: "distance",
      label: "distance(移動距離 px)",
      min: 10,
      max: 120,
      step: 5,
      default: 40,
      desc: "20〜40pxが自然。大きいほど「登場感」が強くなるが、やりすぎると安っぽい。",
    },
    {
      key: "duration",
      label: "duration(表示時間 s)",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.6,
      desc: "0.6s前後が定番。1sを超えるとページ全体がもたついて見える。",
    },
    {
      key: "stagger",
      label: "stagger(連続要素の時間差 ms)",
      min: 0,
      max: 300,
      step: 20,
      default: 80,
      desc: "同時に現れる要素の時間差。0で一斉、80ms前後で心地よいリズムが生まれる。",
    },
  ],
  promptTemplate: `セクション内の要素に scroll fade-in を実装してください。

- IntersectionObserver でビューポート進入を検知する(threshold 0.15 程度)
- 進入前は opacity 0 + translateY({{distance}}px)、進入後に opacity 1 + translateY(0) へ遷移
- transition は {{duration}}s、イージングは cubic-bezier(0.22, 1, 0.36, 1) などの ease-out 系
- 同時に進入した要素には {{stagger}}ms ずつ transition-delay をずらして順番に出す
- 一度表示したら unobserve し、逆スクロールしても消さない
- prefers-reduced-motion 時はアニメーションなしで最初から表示する`,
  ngExample: {
    say: "「スクロールしたらふわっと出るようにして」",
    why: "「ふわっと」では距離・時間・方向が決まらない。要素が一斉に出るのか順番に出るのか、逆スクロールで消えるのかも未定義で、上にスクロールするたびチラつく実装が返ってきがち。",
  },
  okExample: {
    say: "「scroll fade-inを実装。IntersectionObserverで検知、translateY 40px→0とopacityを0.6s、同時進入は80msずつ遅延、一度出たら消さない」",
    why: "検知方式・距離・時間・stagger・再表示の扱いが揃っている。特に「一度出たら消さない」は言わないと逆スクロール時の再アニメーションで壊れやすい。",
  },
  vocab: [
    {
      term: "IntersectionObserver",
      desc: "要素が画面に入った瞬間を検知するブラウザAPI。scrollイベントの監視より軽く、スクロール演出の標準。",
    },
    {
      term: "threshold",
      desc: "要素の何割が見えたら発火するかの閾値。0.15なら15%見えた時点。0だと端に触れた瞬間に発火する。",
    },
    {
      term: "stagger",
      desc: "複数要素の開始時刻を少しずつずらすこと。一斉に出すより順番に出すほうがリズムと高級感が生まれる。",
    },
    {
      term: "unobserve",
      desc: "一度発火した要素の監視を解除すること。逆スクロールでの再アニメーションと無駄な監視コストを防ぐ。",
    },
  ],
  related: ["parallax", "split-text-reveal", "clip-reveal"],
};
