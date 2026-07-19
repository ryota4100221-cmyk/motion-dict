import type { MotionEntry } from "@/lib/types";

export const rubberBand: MotionEntry = {
  slug: "rubber-band",
  category: "scroll",
  nameJa: "ゴムバンド抵抗",
  nameEn: "rubber band / overscroll bounce",
  lede: "スクロールやドラッグが端に達したあとも、ゴムが伸びるように少しだけ動いて指を離すと戻る挙動。iOSが標準で持つ感触で、「ここが端だ」を言葉なしに伝えられる。止まり方がカクッとしないだけで操作の質感が一段上がる。",
  params: [
    {
      key: "pull",
      label: "pull(はみ出しの追従率)",
      min: 0.05,
      max: 0.6,
      step: 0.05,
      default: 0.25,
      desc: "端を越えて引っ張った距離のうち、実際に動く割合の初期値。0.2〜0.3が自然。0.5を超えると「端で止まった」感が薄れる。",
    },
    {
      key: "maxOverscroll",
      label: "maxOverscroll(最大はみ出し px)",
      min: 20,
      max: 160,
      step: 10,
      default: 80,
      desc: "どれだけ引いてもこれ以上は出ない上限。60〜100pxが目安。大きすぎると中身が画面から消えて壊れて見える。",
    },
    {
      key: "snapBack",
      label: "snapBack(戻る時間 s)",
      min: 0.15,
      max: 0.9,
      step: 0.05,
      default: 0.4,
      desc: "指を離してから端まで戻る時間。0.3〜0.5sが気持ちいい。0.6sを超えると「重い」ではなく「遅い」に変わる。",
    },
  ],
  promptTemplate: `横ドラッグできるリストに rubber band(overscroll bounce)を実装してください。

- ドラッグ中はトラックを transform: translate3d(x, 0, 0) で動かす(left や scrollLeft は使わない)
- 可動域の内側では指に1:1で追従させる
- 端を越えた分は「はみ出し量 = (1 - 1 / (はみ出しの生値 * {{pull}} / {{maxOverscroll}} + 1)) * {{maxOverscroll}}」で減衰させる(引くほど重くなり {{maxOverscroll}}px に漸近する)
- ポインタを離したら可動域内にクランプし、{{snapBack}}s の ease-out(cubic-bezier(0.22, 1, 0.36, 1))で戻す
- ドラッグ中は transition を切る(戻すときだけ効かせる)
- setPointerCapture で枠外に出てもドラッグを継続し、コンテナには touch-action: none を指定する
- prefers-reduced-motion 時ははみ出しを一切作らず可動域の端でそのまま止め、戻りのtransitionも無効にする`,
  ngExample: {
    say: "「スワイプで端まで行ったときにiOSっぽくバウンドさせて」",
    why: "「iOSっぽく」では減衰の式も上限も戻り時間も決まらない。はみ出しが線形のまま無制限に伸びる実装や、端でバネのように何度も往復する実装が返ってくる。減衰カーブと上限pxを言わないと必ずブレる。",
  },
  okExample: {
    say: "「rubber bandを実装。可動域内は1:1追従、超過分は追従率0.25で最大80pxまで漸近的に減衰。離したらクランプして0.4s cubic-bezier(0.22,1,0.36,1)で戻す。translate3dのみ、ドラッグ中はtransition無効」",
    why: "減衰の掛かり方(追従率)と天井(最大px)と戻りの時間・イージングを分けて指定している。「ドラッグ中はtransition無効」の一言がないと、追従が常に一拍遅れてゴムではなく単なる鈍い動きになる。",
  },
  vocab: [
    {
      term: "rubber banding",
      desc: "可動域の外へ引っ張ったとき、抵抗を増やしながら少しだけ動かし、離すと端へ戻す挙動。Appleの用語がそのまま業界標準になっている。",
    },
    {
      term: "overscroll",
      desc: "スクロール可能範囲を越えた入力そのもの。ここに何を返すか(バウンド/無反応/親要素へ連鎖)が設計項目。",
    },
    {
      term: "overscroll-behavior",
      desc: "ネイティブのスクロール連鎖を止めるCSSプロパティ。containを指定しないと、モーダル内のスクロール端で背後のページが動く事故が起きる。",
    },
    {
      term: "touch-action",
      desc: "ブラウザ既定のジェスチャをどこまで残すかの指定。自前ドラッグではnoneにしないと、途中でブラウザ側のスクロールに主導権を奪われる。",
    },
  ],
  related: ["scroll-snap", "smooth-scroll", "press-feedback"],
};
