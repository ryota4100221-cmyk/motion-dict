import type { MotionEntry } from "@/lib/types";

export const targetHighlight: MotionEntry = {
  slug: "target-highlight",
  category: "ui",
  nameJa: "飛び先ハイライト（リンク先がぱっと光って引く）",
  nameEn: "yellow fade technique / anchor target highlight / :target flash",
  lede: "目次やページ内リンクで飛んだ先の項目に、薄い色がぱっと乗り、しばらく留まってからすうっと引く。瞬間移動のスクロールは「どこに着いたか」を見失わせるので、着地点だけを一度光らせて目を連れていく。要は、色を引く前に「留める」区間を置くこと。",
  params: [
    {
      key: "duration",
      label: "duration(光ってから消えるまで s)",
      min: 0.8,
      max: 5,
      step: 0.1,
      default: 2.4,
      desc: "色が乗ってから完全に消えるまでの長さ(出典2.4s)。2〜3sで「ここです」と伝わる。1s以下は見落とされ、4s超は消え残りが選択中と誤解される。",
    },
    {
      key: "hold",
      label: "hold(色を留める区間 %)",
      min: 0,
      max: 80,
      step: 5,
      default: 40,
      desc: "duration のうち、最初の色のまま留める割合(出典40%＝0.96s)。目がスクロール後の画面を探し当てるのに約1s要る。0%だと着いた頃には薄れている。",
    },
    {
      key: "strength",
      label: "strength(色の濃さ %)",
      min: 4,
      max: 40,
      step: 1,
      default: 14,
      desc: "アクセント色を背景に混ぜる割合(出典14%)。10〜18%で文字を邪魔しない。25%を超えると選択状態や警告に見える。",
    },
  ],
  promptTemplate: `用語集(左に目次・右に縦スクロールする項目リスト)に yellow fade technique(飛び先ハイライト)を実装してください。

- きっかけ: 左の目次の用語ボタンの click(タッチはタップ)。右のリストを、その項目が上端に来る位置へ一瞬で(scroll-behavior: auto)スクロールしてから光らせる。押すたびに前の項目の光は消して、新しい項目で最初から再生する。同じ項目をもう一度押しても最初から光る。ページの URL ハッシュで飛ぶ場合は hashchange で同じ処理をする
- 光らせ方: 項目の背景色を アクセント色 {{strength}}%(color-mix(in srgb, アクセント {{strength}}%, transparent))にして、{{duration}}s かけて透明に戻す
- キーフレームは 0%〜{{hold}}% は同じ色のまま留め、{{hold}}% → 100% で透明へ。緩急は cubic-bezier(.16, 1, .3, 1)(ease-out-expo 寄り)を「引く区間だけ」に掛ける(CSS の animation-timing-function は区間ごとに掛かる。WAAPI なら options ではなく {{hold}}% のキーフレームに easing を書く)
- 再生し直しは、属性(data-target)を外す → offsetWidth を読んで reflow を挟む → 付け直す。WAAPI なら前の Animation を cancel してから animate
- 色を付けるのは背景だけ。文字色・枠・大きさは変えない(項目の中身を読ませるための光なので、項目は動かさない)
- 項目の角に border-radius を付け、上下左右に余白(padding)を取って、光った範囲が項目のまとまりとして見えるようにする
- prefers-reduced-motion 時は色の変化をアニメーションせず、飛んだ項目に同じ色を {{duration}}s 点けてから一度に消す`,
  ngExample: {
    say: "「目次から飛んだ先が分かるようにして」",
    why: "飛んだ先にずっと残る枠線や太字(選択状態と区別できない)か、scroll-behavior: smooth を足しただけの実装が返ってくる。光らせても0.3sで消えるフェードだと、スクロールが終わって目が探し当てた頃にはもう消えている。",
  },
  okExample: {
    say: "「yellow fade techniqueを。飛び先の背景をアクセント14%にして2.4sで透明へ。0〜40%は留めて、残りに cubic-bezier(.16,1,.3,1)。押すたびに reflow を挟んで最初から」",
    why: "濃さ・長さに加えて「留める区間」を数値で指定している。留めがあるので一瞬で飛んだ後でも光が見つかり、引く区間だけに強い ease-out を掛けるので、消え際が長く尾を引いて目障りにならない。",
  },
  vocab: [
    {
      term: "yellow fade technique",
      desc: "変わった箇所・飛んだ先を黄色く光らせてから消す手法。2004年に37signalsが広めた呼び名で、色が黄色でなくてもこう呼ぶ。",
    },
    {
      term: ":target",
      desc: "URL のハッシュ(#id)と一致する要素に当たる CSS 擬似クラス。JS無しでも飛び先にだけアニメーションを掛けられるが、同じハッシュへの再ジャンプでは再生し直されない。",
    },
    {
      term: "hold(留め)",
      desc: "キーフレームの 0% と途中の % に同じ値を置き、変化させない区間。目がスクロール先を探す時間を確保する。",
    },
    {
      term: "reflow で再生し直す",
      desc: "クラスや属性を外して付け直すだけでは同じフレーム内で畳まれ、CSS アニメーションが最初から走らない。間に offsetWidth を読むと強制的にレイアウトが確定し、再生がやり直される。",
    },
    {
      term: "color-mix()",
      desc: "2色を割合で混ぜる CSS 関数。アクセント色と transparent を混ぜると、テーマ色から半透明の背景をそのまま作れる。",
    },
  ],
  titleAct: { act: "marker-line", map: { duration: "duration*0.25", thickness: 100, delay: 0 } },
  aliases: ["ぱっと光る", "ピカッ", "すうっと消える", "飛んだ先", "アンカーハイライト"],
  related: ["scroll-spy", "marker-line", "text-highlight", "flicker-on"],
};
