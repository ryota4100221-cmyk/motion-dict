import type { MotionEntry } from "@/lib/types";

export const knockOnNudge: MotionEntry = {
  slug: "knock-on-nudge",
  category: "ui",
  nameJa: "玉突き（突いた勢いが隣へ伝わる）",
  nameEn: "knock-on nudge / bump animation / Newton's cradle effect / domino push",
  lede: "先頭の要素が一度身を引いてから前へ突き、少し遅れて隣がコツンと押し出されて戻る。1つが揺れるだけのナッジと違い、勢いが「隣へ伝わった」ことが見えるので、並んだ項目のつながりや次へ進む向きを無言で示せる。要は、押される側を突き手が前へ出た瞬間まで止めておくこと。",
  params: [
    {
      key: "distance",
      label: "distance(突き・押し出しの幅 px)",
      min: 2,
      max: 20,
      step: 1,
      default: 8,
      desc: "突き手が身を引く幅と、押される側が押し出される幅。出典は8px。6〜10pxで「コツン」、14px超はぶつかり合いの喧嘩に見える。隣との間隔もこの程度に詰めると当たったように見える。",
    },
    {
      key: "duration",
      label: "duration(1つの動きの長さ s)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "突き手・押される側それぞれのキーフレーム1回の長さ(出典0.6s)。0.5〜0.7sが自然で、0.4s以下は痙攣、1s超は勢いが抜けて押しているように見えない。",
    },
    {
      key: "relay",
      label: "relay(隣へ伝わる遅れ s)",
      min: 0.05,
      max: 0.4,
      step: 0.01,
      default: 0.15,
      desc: "並び順 i の要素に i × relay の遅れを掛ける(出典0.15s)。0.1〜0.2sで1つずつ伝わって見え、0.05sだと全部が同時に動き、0.3s超は伝わる前に勢いが消えて別々に動いて見える。",
    },
    {
      key: "interval",
      label: "interval(繰り返しの間隔 s)",
      min: 1.5,
      max: 8,
      step: 0.5,
      default: 3,
      desc: "次に突くまでの間隔(出典3s)。案内として使うなら3〜5s。2s以下だとずっと揺れていてうるさい。",
    },
  ],
  promptTemplate: `横に並んだタブ(5つ)に knock-on nudge(先頭が突いて、勢いが隣へ順に伝わる玉突き)を実装してください。

- きっかけ: 操作不要。表示から0.3s後に1回目を鳴らし、以後 setInterval で {{interval}}s ごとに自動で繰り返す。「Knock again」ボタンの click(タッチはタップ)でその場で鳴らし、間隔のタイマーもそこから数え直す。鳴らすたびに前の回のアニメーションは cancel して最初から
- タブは flex で gap 10px に並べ、先頭(突き手)だけにライムの小さな点を付ける
- 突き手のキーフレーム(長さ {{duration}}s): 0% translateX(0) → 40% translateX(−{{distance}}px) → 50% translateX({{distance}} × 0.75 px) → 70% translateX({{distance}} × 0.25 px) → 100% translateX(0)
- 押される側のキーフレーム(長さ {{duration}}s): 0%・30% translateX(0)(止まったまま) → 50% translateX({{distance}}px) → 70% translateX({{distance}} × 0.375 px) → 100% translateX(0)
- 並び順 i(先頭=0)の要素に delay = i × {{relay}}s を掛ける。i = 1 の押し出しの山は 0.5 × {{duration}} + {{relay}}s で、突き手が前へ出た直後に来る
- 緩急は区間ごとに ease-out(CSS の animation-timing-function と同じ掛かり方。WAAPI なら options ではなく各キーフレームに easing: "ease-out" を書く)
- left や margin ではなく transform: translateX で動かす(リフローさせない)
- prefers-reduced-motion 時は自動でもボタンでも動かさず、タブを静止したまま表示する(ボタンは disabled)`,
  ngExample: {
    say: "「ナビのリンクがぶつかるようなアニメーションを付けて」",
    why: "2つを同時に左右へ揺らす実装か、全部を等間隔の stagger で同じ揺れにする実装が返ってくる。押される側が先に動き出したり、突き手の「身を引く」溜めが無かったりして、勢いが伝わったようには見えない。",
  },
  okExample: {
    say: "「knock-on nudgeを。先頭は0.6sで 0→−8→+6→+2→0px(40/50/70%)、隣は 30%まで止めて 50%で+8、70%で+3、遅れは i×0.15s。各区間 ease-out、3sごとに自動」",
    why: "突き手の溜め(−8px)・押される側の「30%まで待つ」・伝わる遅れの3点が揃っている。待つ区間があるので、突き手が前へ出た瞬間に隣が動き出し、当たったように読める。",
  },
  vocab: [
    {
      term: "anticipation(溜め)",
      desc: "動く前に一度逆へ引く予備動作。突き手が−8pxだけ身を引くことで、次の前進が「突き」に見える。",
    },
    {
      term: "momentum transfer(勢いの受け渡し)",
      desc: "ぶつかった側が止まり、ぶつけられた側が動き出すこと。押される側の動き出しを突き手の前進に合わせると、接触が描かれていなくても当たったと読める。",
    },
    {
      term: "hold keyframe(待ちのキーフレーム)",
      desc: "0%と30%に同じ値を置いて止まったままにする区間。delay だけでずらすより、1回のキーフレームの中で「待って、押される」が完結する。",
    },
    {
      term: "relay delay",
      desc: "並び順 i × 一定秒の遅れ。stagger と同じ計算だが、ここでは前の要素に押されて動き出す「伝わる速さ」として決める。",
    },
    {
      term: "Newton's cradle",
      desc: "端の玉を当てると反対の端の玉が飛び出す振り子の玩具。勢いが列を伝わる動きの呼び名として、ローディングや案内の動きでも使われる。",
    },
  ],
  titleAct: { act: "hover-wave", map: { delay: "relay*0.4", height: "distance", duration: "duration" } },
  aliases: ["コツン", "トンッ", "ぐいっ", "玉突き", "押し出す"],
  related: ["hint-nudge", "error-shake", "hover-wave", "pendulum-swing"],
};
