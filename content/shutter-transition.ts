import type { MotionEntry } from "@/lib/types";

export const shutterTransition: MotionEntry = {
  slug: "shutter-transition",
  category: "transition",
  nameJa: "シャッタートランジション",
  nameEn: "shutter transition / blinds wipe",
  lede: "画面が数本の帯(スリット)に分割され、時間差で開いて次の画面に切り替わるトランジション。ブラインドが開くような視覚で、一枚ベタ塗りのワイプより軽やか。帯の本数とstaggerの2つで印象がほぼ決まる。",
  params: [
    {
      key: "panels",
      label: "panels(帯の本数)",
      min: 3,
      max: 12,
      step: 1,
      default: 6,
      desc: "5〜8本が目安。少ないと大味、12本を超えると細かすぎてノイズに見える。",
    },
    {
      key: "stagger",
      label: "stagger(帯ごとの時間差 ms)",
      min: 0,
      max: 120,
      step: 10,
      default: 50,
      desc: "隣の帯との時間差。40〜60msが心地よい。0にすると全帯が同時に動き、ただの一枚ワイプになる。",
    },
    {
      key: "orientation",
      label: "orientation(スリットの向き)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["vertical", "horizontal"],
      desc: "帯の向き。verticalは縦帯が横に開き、horizontalは横帯が縦に開く。",
    },
  ],
  promptTemplate: `ページ遷移に shutter transition(ブラインド式のワイプ)を実装してください。

- 次のページを現在のページの下に重ね、上に {{panels}} 本の帯(スリット)をCSSのflexで敷き詰める
- 帯の向きは {{orientation}}(verticalなら縦帯をscaleXで、horizontalなら横帯をscaleYで開閉する)
- 各帯は transform-origin: center のまま scale 0→1 で次ページ側へ「開く」。1本あたり0.5s、ease-in-out系
- 帯は {{stagger}}ms ずつずらして動かす(stagger)。全体時間 = 0.5s + (本数 - 1) × stagger で逆算する
- 全帯が開き切った瞬間に下のDOMを差し替え、帯はtransitionなしで畳み直す
- widthやclip-pathではなくtransformだけで動かす(リフロー禁止)
- prefers-reduced-motion 時は帯を出さず、即時切り替えか短いフェードにする`,
  ngExample: {
    say: "「ブラインドみたいなトランジションにして」",
    why: "本数・向き・時間差がすべて未定義。全帯が同時に動くただのワイプや、widthの伸縮でカクつく実装が返ってきがち。差し替えタイミングの指定がないと、開き切る前に次のページがチラ見えする事故も起きる。",
  },
  okExample: {
    say: "「shutter transitionを実装。縦6本の帯をscaleX 0→1・各0.5s・50msずらし。origin center、全帯が開いたらDOM差し替え、transformのみ。reduced-motionは即時切替」",
    why: "本数・軸・時間差・差し替えタイミングまで数値で固定されている。「transformのみ」の一言がリフローする実装を防ぎ、「開いたら差し替え」がチラつきを防ぐ。",
  },
  vocab: [
    {
      term: "stagger",
      desc: "複数要素を等間隔の時間差で動かす手法。帯の本数×staggerで全体時間が伸びるため、総時間から逆算して決める。",
    },
    {
      term: "スリット分割",
      desc: "画面をflexやgridで等分し、それぞれを独立に動かす下ごしらえ。帯自体は単色レイヤーでよく、画像を切り刻む必要はない。",
    },
    {
      term: "transform-origin: center",
      desc: "帯の中心から両側へ開くとブラインドらしくなる。端をoriginにすると片側から流れるカーテン寄りの印象に変わる。",
    },
    {
      term: "差し替えタイミング",
      desc: "下のDOM入れ替えは帯が画面を完全に覆った(開き切った)瞬間に行う。ここがずれると前後のページが混ざって見える。",
    },
  ],
  related: ["curtain-wipe", "mosaic-reveal", "circle-reveal"],
};
