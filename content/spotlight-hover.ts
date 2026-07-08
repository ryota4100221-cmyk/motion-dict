import type { MotionEntry } from "@/lib/types";

export const spotlightHover: MotionEntry = {
  slug: "spotlight-hover",
  category: "hover",
  nameJa: "スポットライトホバー",
  nameEn: "spotlight hover / cursor spotlight",
  lede: "カーソル位置を中心に、radial-gradientの光が追従して周囲を照らす動き。暗いセクションを撫でると内容がほのかに浮かび上がる。カードの境界線だけを照らすパターンも派生形。",
  params: [
    {
      key: "radius",
      label: "radius(光の半径 px)",
      min: 60,
      max: 300,
      step: 10,
      default: 140,
      desc: "照らす範囲。小さいと懐中電灯、大きいと間接照明の印象。",
    },
    {
      key: "softness",
      label: "softness(縁のぼかし)",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.6,
      desc: "0はくっきりした円、1に近いほど縁が溶けるように消える。",
    },
  ],
  promptTemplate: `セクションに spotlight hover を実装してください。

- カーソル位置を CSS変数(--x, --y)に反映し、radial-gradient の中心にする
- 光の半径は {{radius}}px、縁のぼかしは係数 {{softness}}(0でくっきり、1で溶けるように)
- 光の色は rgba(233,230,223,0.14) 程度のごく淡いものにする(照らしすぎない)
- mousemove は requestAnimationFrame でスロットリングし、毎イベントで再描画しない
- mouseleave 時は光を opacity で 0.3s かけてフェードアウトする
- prefers-reduced-motion 時は追従させず、光を無効化または中央に固定表示する`,
  ngExample: {
    say: "「マウスのところが光るようにして」",
    why: "光の半径・強さ・縁の質感が未定義。真っ白なグラデーションがベタッと乗った、目に痛い実装が返ってきがち。「どのくらい淡いか」は数値でしか伝わらない。",
  },
  okExample: {
    say: "「spotlight hoverを実装。radial-gradientをCSS変数で追従、radius 140px、光はrgba(233,230,223,0.14)のごく淡いもの、leaveでフェードアウト」",
    why: "実装方式(CSS変数+radial-gradient)・サイズ・光の強さ・終了時の挙動が揃っている。淡さのrgba指定が品を決める。",
  },
  vocab: [
    {
      term: "radial-gradient",
      desc: "中心から外へ向かう円形グラデーション。スポットライトの実体。",
    },
    {
      term: "CSS変数",
      desc: "JSからは座標だけ渡し、描画はCSSに任せる分業。styleの書き換えより速く、保守もしやすい。",
    },
    {
      term: "ストップ位置",
      desc: "グラデーションの色が切り替わる位置。内側の不透明ストップを外へ寄せるほど縁がくっきりする。",
    },
    {
      term: "フェードアウト",
      desc: "mouseleaveで光を即消しすると安っぽい。opacityを0.3s程度で落とすと余韻が出る。",
    },
  ],
  related: ["magnetic-hover", "tilt", "custom-cursor"],
};
