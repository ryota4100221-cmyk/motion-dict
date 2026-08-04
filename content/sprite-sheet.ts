import type { MotionEntry } from "@/lib/types";

export const spriteSheet: MotionEntry = {
  slug: "sprite-sheet",
  category: "media",
  nameJa: "コマ送り再生",
  nameEn: "sprite sheet animation / steps() animation / frame-by-frame",
  lede: "横一列に並べた絵を「窓」で1コマずつずらして見せ、パラパラ漫画として再生する演出。補間をやめて steps() で跳ばすのが要で、手描きの質感やレトロなキャラクター表現を動画なしで持ち込める。",
  params: [
    {
      key: "frames",
      label: "frames(コマ数)",
      min: 2,
      max: 12,
      step: 1,
      default: 6,
      desc: "1枚の帯に並べる絵の数。4〜8枚で「動いている」と読める。増やすほど滑らかになるが、滑らかにしたいならそもそもコマ送りにしない。",
    },
    {
      key: "duration",
      label: "duration(1周の再生時間 s)",
      min: 0.2,
      max: 2,
      step: 0.05,
      default: 0.6,
      desc: "1コマの表示時間 = duration ÷ frames。0.08〜0.12s/コマ(8〜12fps)が手描きらしい間合い。速すぎるとコマの絵が読めない。",
    },
    {
      key: "loop",
      label: "loop(再生の仕方)",
      min: 0,
      max: 2,
      step: 1,
      default: 1,
      options: ["1回だけ", "ループ", "往復ループ"],
      desc: "ホバーで反応させるなら「1回だけ」で最終コマに留める。常時動かす飾りは「ループ」、呼吸のような往復は「往復ループ」。",
    },
    {
      key: "timing",
      label: "timing(コマの送り方)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["steps(コマ送り)", "linear(補間あり)"],
      desc: "linearに切り替えると帯がスライドして2コマが同時に見える。これがコマ送りで最も多い実装ミス。steps以外はまず選ばない。",
    },
  ],
  promptTemplate: `キャラクターアニメーションを sprite sheet animation で実装してください。

- 絵を横一列に並べた帯(コマ数 {{frames}})を、1コマぶんの大きさの窓に overflow: hidden で入れる
- 帯を transform: translateX で動かし、animation-timing-function は {{timing}} を使う
- 1周 {{duration}}s、再生は {{loop}}
- background-position ではなく transform で動かす(合成のみでリフローさせない)
- コマの境界で絵が2枚見えないよう、窓の幅と1コマの幅を完全に一致させる
- prefers-reduced-motion 時は自動再生せず、最初のコマを静止表示する(必要ならクリックで手動送り)`,
  ngExample: {
    say: "「キャラクターをパラパラ漫画みたいに動かして」",
    why: "補間の指定が無いので、帯がぬるっとスライドするだけの実装(linear)や、GIF・動画への差し替えが返ってくる。「コマで跳ぶ」という一番大事な性質が落ちる。",
  },
  okExample: {
    say: "「6コマのスプライトシートを steps(6) で0.6s、ホバー中だけ1回再生。帯を translateX で送り、窓は1コマ幅にぴったり合わせる」",
    why: "コマ数・timing-function・尺・トリガ・実装方式まで指定している。steps の引数がコマ数と一致していることまで書けると、境界で2コマ見える事故が消える。",
  },
  vocab: [
    {
      term: "steps()",
      desc: "指定した回数だけ値を階段状に跳ばすタイミング関数。中間値を作らないので、コマとコマの間の「中途半端な絵」が生まれない。",
    },
    {
      term: "sprite sheet",
      desc: "複数のコマを1枚の画像に並べたもの。リクエストが1回で済み、コマ間の読み込み待ちが起きない。",
    },
    {
      term: "jump-end",
      desc: "steps()の既定の挙動。最後のコマは終了の瞬間にしか出ないため、1回再生で最終コマに留めたいときは steps(コマ数 - 1) にして移動量も1コマぶん減らす。",
    },
    {
      term: "fps(コマ/秒)",
      desc: "手描き風は8〜12fpsが定番。60fpsに近づけるほど「アニメらしさ」は消えて、ただの滑らかな移動になる。",
    },
    {
      term: "animation-direction: alternate",
      desc: "往復再生。行きの絵をそのまま帰りに使えるので、コマ数を増やさず動きの長さだけ倍にできる。",
    },
  ],
  related: ["split-flap", "typewriter", "boot-sequence"],
};
