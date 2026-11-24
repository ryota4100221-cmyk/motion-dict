import type { MotionEntry } from "@/lib/types";

export const blossomBloom: MotionEntry = {
  slug: "blossom-bloom",
  category: "media",
  nameJa: "花が咲く（つぼみが膨らんで花に替わる）",
  nameEn: "blossom bloom / flower bloom animation / blooming flowers",
  lede: "枝の付け根から、まずつぼみがぷくっと膨らみ、それが消えるのと入れ替わりに花がふわっと開く。一輪ごとに少しずつ遅らせて枝の左上から右下へ波のように咲かせると、ただの拡大が「季節が来た」に見える。拡大の中心を花の中心ではなく枝との付け根に置くのが要。",
  params: [
    {
      key: "duration",
      label: "duration(花が開く時間 s)",
      min: 0.2,
      max: 1.6,
      step: 0.05,
      default: 0.55,
      desc: "いちばん速い花の開く時間。花ごとに最大1.8倍まで伸ばしてばらつかせる(出典は0.55〜1.0s)。0.5〜0.8sで「ふわっ」、0.3s以下は弾けて見え、1.2s超は咲くのを待たされる。",
    },
    {
      key: "wave",
      label: "wave(咲く波の遅れ s/1000px)",
      min: 0,
      max: 1.5,
      step: 0.01,
      default: 0.6,
      desc: "花の位置(x + y)1000pxあたりの遅れ。左上から右下へ斜めに咲き進む。出典は幅1440pxのヒーローで1/3400 s/px(約0.29)。デモの舞台は小さいので0.6で同じくらいの広がりに見える。0で全部いっせいに咲く。",
    },
    {
      key: "jitter",
      label: "jitter(隣どうしのずれ s)",
      min: 0,
      max: 0.12,
      step: 0.005,
      default: 0.04,
      desc: "並び順 i の i % 3 × jitter を足して、同じ位置にある花の咲く拍をずらす。0.03〜0.05sで自然、0だと波が定規で引いたように揃い機械的になる。",
    },
    {
      key: "budLead",
      label: "budLead(つぼみが先に出る時間 s)",
      min: 0,
      max: 0.6,
      step: 0.05,
      default: 0.3,
      desc: "花が開き始める何秒前につぼみを出すか。0.2〜0.4sで「つぼみ→花」の順が読める。0だとつぼみが見えず花だけが拡大する。",
    },
  ],
  promptTemplate: `枝の絵に blossom bloom(つぼみが膨らんで花に替わり、枝に沿って波のように咲く)を実装してください。

- きっかけ: 枝の絵が表示されたら1回だけ全部の花を咲かせる。「Bloom again」ボタンの click で、全部の花とつぼみを消してから最初からもう一度咲かせる(アニメーションを外して付け直す)。スライダーの値を変えたときも同じく最初から咲き直す。ループはしない。タッチはボタンのタップ
- 枝は SVG の線で描き、花を付ける位置(付け根)ごとに <g transform="translate(x y) rotate(枝の外向きの角度)"> を置く。その中に「つぼみ」と「花」の2つの <g> を重ね、どちらも付け根(0,0)から外へ向かって描く(花の中心は付け根から花の半径ぶん外)
- 2つの <g> は transform-box: view-box; transform-origin: 0 0 にして、付け根を中心に拡大させる(花の中心で拡大させない)
- 花 i の遅れ delay = 0.05 + (x + y) / 1000 × {{wave}} + (i % 3) × {{jitter}} 秒。x, y は枝の絵の左上を原点にした付け根の位置(px)
- 花 i の開く時間 = {{duration}} × (1 + ((i × 37) % 10) / 10 × 0.8) 秒(花ごとに最大1.8倍までばらつかせる)
- 花のキーフレーム: 0% opacity 0 / scale(0.2) → 100% opacity 1 / scale(1)。緩急 cubic-bezier(0.2, 0.65, 0.3, 1)、delay は上の delay、fill-mode both
- つぼみのキーフレーム: 0% opacity 0 / scale(0.2) → 60% opacity 1 / scale(1) → 100% opacity 0 / scale(1)。長さ {{budLead}} / 0.6 秒の ease、開始は delay − {{budLead}} 秒(60% の山がちょうど花の開き始めに来て、花と入れ替わりに消える)、fill-mode both
- 花を付けない「つぼみだけ」の付け根もいくつか混ぜる。つぼみだけの付け根は花のキーフレームでつぼみの絵を開かせ、そのまま残す
- 動かすのは transform と opacity だけ(width・r・d を動かさない)
- prefers-reduced-motion 時はアニメーションせず、全部の花が開いた最後の状態を最初から表示する(つぼみは出さない)`,
  ngExample: {
    say: "「花が咲くアニメーションを付けて」",
    why: "花の中心を基準に scale(0→1) するだけの実装が返ってくる。枝から離れた所で花が膨らむので「咲く」ではなく「現れる」に見え、全部が同時か等間隔の stagger で機械的に並ぶ。つぼみも出てこない。",
  },
  okExample: {
    say: "「blossom bloomを実装。付け根を transform-origin にして花を scale 0.2→1、cubic-bezier(0.2,0.65,0.3,1)で0.55〜1.0s。0.3s前につぼみを膨らませ花と入れ替わりに消す。遅れは0.05+(x+y)/1000×0.6s+(i%3)×0.04s」",
    why: "拡大の中心(付け根)・つぼみと花の重なり方・遅れの式まで指定。「(x+y)で遅らせる」の一言で、枝の左上から右下へ斜めに咲き進む波になる。",
  },
  vocab: [
    {
      term: "transform-box: view-box",
      desc: "SVG の要素で transform-origin を何に対して測るかの指定。view-box にして origin 0 0 と書くと、translate した <g> の原点＝付け根を中心に拡大できる。fill-box だと絵の外接矩形が基準になり花の中心で膨らむ。",
    },
    {
      term: "bud → bloom の入れ替え",
      desc: "つぼみと花を別の絵として重ね、つぼみが膨らみ切った瞬間に花を開き始めてつぼみを消す。1つの絵を拡大するより「変わった」ことが伝わる。",
    },
    {
      term: "diagonal stagger(x + y)",
      desc: "遅れを座標の和で決める並べ方。x + y が同じ点は同時に動くので、左上から右下へ斜めの波が進む。",
    },
    {
      term: "jitter",
      desc: "規則的な遅れにわざと足す小さなずれ。(i % 3) のような周期の短い値を足すと、乱数を使わずに毎回同じ「ばらつき」が作れる。",
    },
    {
      term: "fill-mode: both",
      desc: "開始前は 0% の状態(見えない)、終了後は 100% の状態(開いたまま)を保つ指定。遅れの長い花が最初から見えてしまうのを防ぐ。",
    },
  ],
  titleAct: { act: "stagger-grid", map: { duration: "duration", stagger: "wave*0.1", direction: 0 } },
  aliases: ["ぽんっ", "ふわっ", "ぷくっ", "開花", "桜"],
  related: ["stagger-grid", "snowfall", "bounce-in", "line-draw"],
};
