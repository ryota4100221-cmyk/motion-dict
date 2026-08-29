import type { MotionEntry } from "@/lib/types";

export const textOnPath: MotionEntry = {
  slug: "text-on-path",
  category: "scroll",
  nameJa: "カーブテキスト",
  nameEn: "text on path / curved text scrub",
  lede: "曲線に沿って組まれた文字列が、スクロールに合わせてその線の上を流れていく見出し演出。動かすのは字形ではなくパス上の「位置」だけなので、弧をどれだけ深くしても文字が歪まず、行送りも崩れない。",
  params: [
    {
      key: "curve",
      label: "curve(弧の深さ px)",
      min: 0,
      max: 160,
      step: 10,
      default: 90,
      desc: "パスがどれだけ弓なりに反るか。60〜110pxが「曲がっている」と読める範囲。0で直線送りになり、140px超は端の文字が縦に近づいて読みにくくなる。",
    },
    {
      key: "travel",
      label: "travel(送り量 パス長に対する%)",
      min: 80,
      max: 260,
      step: 10,
      default: 160,
      desc: "スクロールを最後まで送ったときに文字列がパス上を進む距離。「文字列の長さ(パス長比) + 100%」が、画面外から入って画面外へ抜けるちょうどの値。既定の160%はこの計算どおりで、増やすほど前後に文字の居ない«間»ができる。100%を切ると文が入りきる前に止まる。",
    },
    {
      key: "length",
      label: "length(スクロール距離 ステージ高の倍数)",
      min: 1,
      max: 6,
      step: 0.5,
      default: 4,
      desc: "この送りに何画面ぶんのスクロールを充てるか。3〜4倍で「読みながら送る」速度になる。1.5倍以下だと一瞬で流れ去り、5倍超はスクロールが重く感じる。スマホは画面が低いぶん同じ倍数でも速くなるので、ブレークポイントごとに見直す。",
    },
  ],
  promptTemplate: `見出しに text on path（スクロール連動のカーブテキスト）を実装してください。

- SVGを1枚置き、defs に2次ベジェのパス（両端は画面外まで伸ばす／制御点のYを {{curve}}px 持ち上げて弓なりにする）を定義する
- 見出しは <text><textPath href="#パスのid" text-anchor="start"> で組み、パスに沿わせる
- スクロール進捗（0→1）を startOffset の % に写像し、100% から (100 - {{travel}})% まで動かす。単位は必ず%にしてパス長の実測に依存させない
- セクションは position: sticky で画面に固定し、スクロール距離はステージ高の {{length}} 倍を確保する。固定を解く位置と送り終わりを一致させる
- 更新は startOffset 属性のみ。text や path の d を毎フレーム書き換えたり、文字を1文字ずつ span に割って個別配置したりしない
- 進捗は rAF で1フレーム1回だけ反映し、前フレームとの差が0.1%未満なら属性を書き戻さない
- パスのidはコンポーネントごとにユニークにする（同じidが2つあると2枚目のtextPathが1枚目のパスを参照して重なる）
- prefers-reduced-motion 時はスクロール連動を止め、text-anchor: middle・startOffset: 50% で文字列を弧の中央に静止表示する（見出しは必ず読める状態で残す）`,
  ngExample: {
    say: "「見出しをカーブさせて、スクロールで動かして」",
    why: "「カーブ」がCSSのrotateによる1文字ずつの傾け実装で返ってくることが多く、字間が揃わず弧も歪む。送りの尺（何画面ぶんのスクロールか）も決まらないので、一瞬で流れ去るか、延々スクロールしても終わらないかのどちらかになる。",
  },
  okExample: {
    say: "「SVGのtextPathで見出しを2次ベジェに沿わせ、スクロール進捗をstartOffsetの100%→-60%に写像。セクションはstickyでステージ高4倍ぶん固定。更新はstartOffset属性のみ、reduced-motion時は50%で静止」",
    why: "組版はtextPathに任せる・動かすのはstartOffsetだけ、と実装方式を先に固定している。送りの範囲（%）と尺（4倍）が数値で入っているので速度が一意に決まり、静止時の見え方まで指定されている。",
  },
  vocab: [
    {
      term: "textPath",
      desc: "SVGのtextをpathに沿わせる要素。href で参照したパスの上に文字が流し込まれ、字形の向きはパスの接線に自動で追従する。",
    },
    {
      term: "startOffset",
      desc: "文字列をパスの始点から何%の位置に置くかの指定。ここだけを動かすと、組版はそのままに文字がパス上を送られる。",
    },
    {
      term: "text-anchor",
      desc: "startOffset を文字列のどこに合わせるかの揃え。start なら先頭、middle なら中央。送りは start、静止表示は middle が扱いやすい。",
    },
    {
      term: "pin(ピン留め)",
      desc: "セクションを画面に固定したままスクロール量だけを進める手法。送りの尺はこのピンの高さで決まるので、ブレークポイントごとの高さ指定が速度の設計そのものになる。",
    },
  ],
  related: ["rotating-badge", "motion-path", "scroll-scrub"],
};
