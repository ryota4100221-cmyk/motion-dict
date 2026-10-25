import type { MotionEntry } from "@/lib/types";

export const flameFlicker: MotionEntry = {
  slug: "flame-flicker",
  category: "hover",
  nameJa: "炎のゆらめき（フレームフリッカー）",
  nameEn: "flame flicker / fire icon animation / flickering flame",
  lede: "炎のアイコンが根元を軸に伸び縮みしながら横へ傾ぎ、火の粉を2つ吹いて静まる動き。肝は回転の中心を炎の底に置くことと、揺れを不規則な刻みで少しずつ減らすことで、中心で回したり等間隔で振ったりすると炎ではなく旗やメトロノームに見える。",
  params: [
    {
      key: "duration",
      label: "duration(ゆらめき1回の長さ s)",
      min: 0.6,
      max: 3,
      step: 0.1,
      default: 1.5,
      desc: "ホバー1回ぶんの長さ。実測は1.5sで、1.2〜1.8sが「ぼっと燃えて落ち着く」に見える。1s未満は痙攣、2.5sを超えるとホバーし終わっても燃え続けて間延びする。",
    },
    {
      key: "lean",
      label: "lean(傾ぎの最大 skewX deg)",
      min: 0,
      max: 15,
      step: 0.5,
      default: 6,
      desc: "炎が横へなびく最大の傾き。実測は6deg(同時に rotate を約0.4倍の2.25deg)。4〜8degが自然で、12degを超えると風に煽られた松明になる。0にすると伸び縮みだけの脈動になる。",
    },
    {
      key: "stretch",
      label: "stretch(伸び縮みの最大 %)",
      min: 0,
      max: 12,
      step: 0.5,
      default: 5,
      desc: "縦に伸びる・つぶれる振れ幅。実測は+5%/−2.5%と伸び側を大きくとる。3〜6%で十分見え、10%を超えるとゴム風船のように弾んで炎らしさが消える。",
    },
    {
      key: "sparks",
      label: "sparks(火の粉の数)",
      min: 0,
      max: 4,
      step: 1,
      default: 2,
      desc: "炎の先から立ちのぼって消える小さな点。実測は2つを時間差(14%と38%)で。1〜2つが上品で、4つにすると焚き火の演出に寄る。0なら形の揺れだけ。",
    },
  ],
  promptTemplate: `アイコンに flame flicker(炎のゆらめき)を実装してください。

- きっかけ: ボタン(行全体)への pointerenter・focus・click のたびに1回だけ再生する。再生中に入り直しても無視し、終わったら次の入りで再び燃える
- 炎は1つのSVGアイコンにし、transform-origin を炎の底辺の中央(24pxのアイコンなら 50% 87.5%＝炎の底 y=21)に置く。SVG内の path に掛ける場合は transform-box: fill-box も指定する
- ホバー(タッチ端末ではタップ)で1回だけ再生する。長さは {{duration}}s。easing は各キーフレーム区間ごとに ease-in-out(全体に1本掛けない)。負の delay(−{{duration}}s × 0.07)で頭の0〜7%を飛ばし、形の揺れから見せる
- キーフレームは不規則な刻み(7% / 17% / 28% / 40% / 53% / 67% / 80% / 90%)で置き、skewX は {{lean}}deg を最大とした比 0 / 0 / 0.67 / 1 / 0.42 / 0.75 / 0.29 / 0.1 / 0(0%〜90%)で右へ傾いでは戻り、90%で transform: none に戻す。rotate は skewX の約0.4倍を同じ向きに足す
- 同じ刻みで scaleY を最大 +{{stretch}}% 伸ばし、その半分だけつぶす(既定5%で 0.99 / 1.05 / 0.975 / 1.04 / 0.982 / 1.02 / 1.008 / 1)。scaleX は scaleY と逆向きに3割ほど動かして体積を保つ
- 炎の先から {{sparks}} 個の火の粉(直径4pxの円)を時間差で出す。1粒目は全体の14%から、以降は24%おき(数が多いときは 0.42 /(数−1) に詰める)。各粒は出てから9%で opacity 0.9・上へ5px・scale 0.9、30%で上へ15px・横へ粒ごとに −4〜+6px 流れて scale 0.45・opacity 0 で消える(区間は ease-out)
- ホバー中に再度入っても途中から頭出しにならないよう、再生中は重ねて開始しない。animation: infinite で燃やし続けない
- transform と opacity だけで動かす(width や path の d は動かさない)
- prefers-reduced-motion 時はゆらめきと火の粉を出さず、色の変化だけでホバーを示す`,
  ngExample: {
    say: "「炎のアイコンがメラメラ燃えるようにアニメーションさせて」",
    why: "「メラメラ」は数値にならないので、中心を軸にした rotate の左右往復を infinite で回す実装が返りやすい。底が浮いて旗のようにはためき、ずっと動き続けて隣のテキストまで読みにくくなる。",
  },
  okExample: {
    say: "「flame flickerで。transform-originは炎の底の中央。ホバーで1.5sを1回、ease-in-out。不規則な刻みで skewX 最大6deg・rotate はその0.4倍、scaleY は+5%/−2.5%で減衰させ90%で静止。火の粉2つを14%と38%から時間差で昇らせて消す。infiniteにしない。reduced-motionでは色だけ」",
    why: "回転の中心(底)・傾ぎと伸び縮みの数値・減衰して止まるタイミング・火の粉の数と時間差まで指定している。「底を軸に」と「1回で静まる」の2点が、はためく旗と燃えっぱなしの騒がしさを両方防ぐ。",
  },
  vocab: [
    {
      term: "transform-origin: bottom",
      desc: "変形の基準点を底辺に置く指定。炎・草・ろうそくのように根元が固定された物は、ここを底にしないと全体が宙に浮いて揺れて見える。",
    },
    {
      term: "skewX",
      desc: "横方向の傾き(せん断)。底を止めたまま先端だけを横へずらせるので、rotate よりも「なびく」形になる。",
    },
    {
      term: "減衰(decay)",
      desc: "振れ幅を回ごとに小さくしていくこと。最初が一番大きく、だんだん静まって止まると「火がついて落ち着いた」と読める。",
    },
    {
      term: "体積保存(volume preservation)",
      desc: "縦に伸ばしたら横を細く、縦につぶしたら横を太くする原則。scaleY だけ動かすとゴムのように膨らんで見える。",
    },
    {
      term: "負の animation-delay",
      desc: "アニメーションを途中から始める指定。元サイトは −0.105s で頭のフェードイン(0〜7%)を飛ばし、ホバー時は形の揺れから見せていた。",
    },
  ],
  titleAct: { act: "flame-flicker" },
  aliases: ["メラメラ", "ゆらゆら", "炎", "燃える"],
  related: ["flicker-on", "squash-stretch", "like-burst"],
};
