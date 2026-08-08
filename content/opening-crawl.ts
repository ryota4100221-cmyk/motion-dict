import type { MotionEntry } from "@/lib/types";

export const openingCrawl: MotionEntry = {
  slug: "opening-crawl",
  category: "text",
  nameJa: "オープニングクロール",
  nameEn: "opening crawl / star wars crawl / perspective text crawl",
  lede: "文章を奥へ倒した面の上で等速に流し、遠ざかりながら消えていく導入演出。傾きと消失点の深さだけで「宇宙」にも「叙事詩」にもなるが、読ませる気があるかは減衰マスクの位置で決まる。",
  params: [
    {
      key: "perspective",
      label: "perspective(消失点までの距離 px)",
      min: 200,
      max: 900,
      step: 20,
      default: 420,
      desc: "小さいほど奥行きが強く、文字が急激に潰れる。300〜500pxが「遠ざかる」と読めて字も残る範囲。900pxはほぼ平面。",
    },
    {
      key: "tilt",
      label: "tilt(面の傾き deg)",
      min: 30,
      max: 75,
      step: 1,
      default: 58,
      desc: "rotateXの角度。55〜62degが原典の見え方。70degを超えると手前の行まで潰れて本文が読めない。",
    },
    {
      key: "duration",
      label: "duration(一巡の時間 s)",
      min: 8,
      max: 40,
      step: 1,
      default: 18,
      desc: "文字数に比例させる。本文3〜4段落なら60〜120sが実サイトの相場で、デモのような短文は15〜25s。速いと読ませる気がないと伝わる。",
    },
    {
      key: "fade",
      label: "fade(奥のフェード終端 %)",
      min: 0,
      max: 60,
      step: 2,
      default: 34,
      desc: "上端から何%までを透明→不透明にするか。30〜40%で「暗闇に溶ける」。0%だと奥で文字が切り落とされて安っぽくなる。",
    },
  ],
  promptTemplate: `テキストブロックに opening crawl(star wars crawl)を実装してください。

- 外側のラッパーに perspective: {{perspective}}px と perspective-origin: 50% 25% を置き、overflow: hidden で囲う
- 内側の本文ブロックに transform-origin: 50% 100% と rotateX({{tilt}}deg) をかけ、傾けた面の上に文字を乗せる
- 本文は translateY(100%) から translateY(-160%) へ {{duration}}s の linear で流す(easeを付けると等速に見えず失速する)
- 奥(上端)は mask-image: linear-gradient(to bottom, transparent 0, #000 {{fade}}%) で溶かす。opacityで要素ごと薄めない
- 動かすのは transform のみ。top や margin のアニメーションはリフローするので使わない
- prefers-reduced-motion 時は rotateX とアニメーションを外し、傾けていない静止テキストとして読める状態にする`,
  ngExample: {
    say: "「スターウォーズみたいに文字を流して」",
    why: "傾きも消失点も速度も決まらない。奥のフェードが無いまま上端でスパッと切れる実装や、rotateXを掛けずにただ上へスクロールするだけの実装が返ってくる。読み終わる前に流れきる速度で来ることも多い。",
  },
  okExample: {
    say: "「opening crawlを実装。perspective 420px、rotateX 58deg、translateYを100%→-160%へ18s linear、上端はmask-imageで34%まで透明。transformのみ、reduced-motionでは傾けず静止表示」",
    why: "面の作り方(perspective+rotateX)と流し方(translateY・linear)と消え方(mask)を分けて指定している。「linear」と「mask-imageで溶かす」の2点が、それらしく見えるかどうかを決める。",
  },
  vocab: [
    {
      term: "perspective",
      desc: "子要素の3D変形を投影する際の、視点から面までの距離。小さいほど遠近が誇張され、奥の文字が強く潰れる。",
    },
    {
      term: "perspective-origin",
      desc: "消失点の位置。50% 25%のように上寄せにすると、文字が画面上方の一点へ吸い込まれていく。",
    },
    {
      term: "rotateX",
      desc: "横軸まわりの回転。正の角度で上端が奥へ倒れ、床に寝かせた面の上に文字が乗った状態になる。",
    },
    {
      term: "mask-image",
      desc: "グラデーションで要素の不透明度を場所ごとに削る指定。奥の文字を暗闇に溶かすのに使う。opacityと違い一部だけ消せる。",
    },
    {
      term: "linear",
      desc: "等速のイージング。クロールは機械送りの見立てなので、ease系を当てると終盤で失速して安っぽくなる。",
    },
  ],
  related: ["perspective-reveal", "marquee", "typewriter"],
};
