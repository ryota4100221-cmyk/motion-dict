import type { MotionEntry } from "@/lib/types";

export const misregistration: MotionEntry = {
  slug: "misregistration",
  category: "text",
  nameJa: "版ズレ（刷り重ねた2枚目の版がゆらっとずれる）",
  nameEn: "misregistration effect / print misregister / double impression drift / risograph offset",
  lede: "同じ文字を2枚重ねて刷り、2枚目の版だけを0.05em前後の小さな幅でゆっくり往復させる、印刷の版ズレ(見当ズレ)を借りた文字の質感。RGBに割れるグリッチと違って色は増やさず、半分の濃さの墨がにじむように輪郭からはみ出すので、紙と活字の「刷り物らしさ」が出る。ずれは動いていると気付かない程度に小さく遅く保つのが要。",
  params: [
    {
      key: "offset",
      label: "offset(版のズレ幅 em)",
      min: 0.01,
      max: 0.15,
      step: 0.005,
      default: 0.05,
      desc: "2枚目の版がずれる最大の幅(文字サイズ比)。0.03〜0.06emで「刷りが甘い」と読め、文字も崩れない。0.1emを超えると二重に見えて読みにくく、0.02em以下は大きな見出しでないと気付かれない。",
    },
    {
      key: "wobble",
      label: "wobble(版の伸び縮み %)",
      min: 0,
      max: 4,
      step: 0.1,
      default: 1.2,
      desc: "2枚目の版を、往路の端で+wobble%・復路の端で−wobble/2%だけ拡縮する(紙の伸びの見立て)。1%前後で輪郭の片側だけが太ったり痩せたりして生っぽくなる。0なら平行移動だけ、3%を超えると字が膨らんで見える。",
    },
    {
      key: "duration",
      label: "duration(片道の時間 s)",
      min: 0.8,
      max: 8,
      step: 0.1,
      default: 3.2,
      desc: "ずれが端から端へ移る片道の時間(往復はこの2倍)。3〜4sで「止まっているのに、たまに違って見える」程度になる。1.5sを切ると震えて見え、グリッチの仲間に寄ってしまう。",
    },
    {
      key: "ink",
      label: "ink(2枚目の版の濃さ opacity)",
      min: 0.2,
      max: 0.9,
      step: 0.05,
      default: 0.5,
      desc: "重ねる版の不透明度。0.4〜0.6で、はみ出た部分だけが淡い墨として見える。0.8以上は影や太字に見え、0.3以下はずれ自体が見えにくい。",
    },
  ],
  promptTemplate: `見出しに misregistration(版ズレ：同じ文字を2枚刷り重ね、2枚目の版がゆっくりずれる)を実装してください。

- きっかけ: ページ読み込み直後から操作不要で2枚目の版が往復し続ける(無限ループ)。版の位置は rAF で毎フレーム経過時間から計算して書き込む。「Align plates」ボタン(または紙面)をクリック/タップすると見当が合う＝ずれが0へ縮み(係数 k を毎フレーム寄せる・60fpsで約0.4s)、もう一度押すと同じ速さでずれが戻って往復を再開する
- 見出しは同じ文字の要素を2つ重ねる(position: absolute で同じ位置に置く)。1枚目は墨100%で静止、2枚目は aria-hidden にして opacity {{ink}}・mix-blend-mode: multiply(白い紙の上で墨同士が重なった部分だけ濃くなる)
- 2枚目の版は端A ↔ 端B を {{duration}}s で片道、ease-in-out(cubic-bezier(0.42, 0, 0.58, 1))で行って戻る(alternate)。端A = translate({{offset}}em, −0.7×{{offset}}em) scale(1 + {{wobble}}/100)、端B = translate(−0.6×{{offset}}em, {{offset}}em) scale(1 − {{wobble}}/200)
- ずれの単位は em にする(見出しの文字サイズに比例させ、どの画面幅でも同じ刷りの甘さに見せる)。transform だけで動かし、top/left やレイアウトを触らない
- 見当合わせは、ずれ全体に掛ける係数 k(1=ずれる・0=見当が合う)を毎フレーム k += (目標 − k)×0.12 で目標へ寄せて表す(translate も scale の1からの差も k 倍)
- 色は増やさない。2枚目も同じ墨色で、濃さ(opacity)だけを変える。RGBに割る・赤青の版にするとグリッチに見える
- 本文には使わない。大きな見出し1つか、ロゴ・号数の数字だけに限定する
- prefers-reduced-motion 時は往復を止め、端Aの位置(ずれた状態)で静止させる。見当合わせのボタンは即座に切り替える`,
  ngExample: {
    say: "「見出しに印刷っぽいズレの演出を入れて」",
    why: "「印刷っぽいズレ」はたいてい赤と青の text-shadow を左右に数pxずらす色収差(グリッチ)として返ってくる。色が増えてデジタルな誤作動に見え、刷り物の甘さにはならない。ズレの幅・速さ・動くかどうかも決まらないので、ガタガタ震えるか完全に静止した二重文字になりがち。",
  },
  okExample: {
    say: "「misregistrationを実装。同じ見出しを2枚重ね、2枚目は同じ墨でopacity 0.5・multiply。translate(0.05em, −0.035em) scale(1.012) ↔ translate(−0.03em, 0.05em) scale(0.994) を片道3.2s ease-in-out で往復。em単位・transformのみ。クリックでずれを0へ寄せて見当合わせ。reduced-motionは端で静止」",
    why: "版を2枚にすること・色を増やさず濃さだけ変えること・ずれの幅を em で、往復の両端と速さを数値で指定している。「同じ墨で multiply」の一言がグリッチとの分かれ目で、em 単位にすると見出しの大きさが変わっても刷りの甘さが揃う。",
  },
  vocab: [
    {
      term: "版ズレ・見当ズレ(misregistration)",
      desc: "多色・多版の印刷で、版どうしの位置(見当)が合わずに刷りがずれること。輪郭の片側に淡い縁や白い隙間が出る。",
    },
    {
      term: "トンボ・見当合わせ(registration marks)",
      desc: "版の位置を合わせるために紙の外側に刷る十字の印。版がずれるとこの十字が二重に割れるので、ずれの大きさが一目で分かる。",
    },
    {
      term: "刷り重ね(overprint)",
      desc: "下の版を抜かずに上の版を重ねて刷ること。画面では mix-blend-mode: multiply で再現でき、重なった部分だけが濃くなる。",
    },
    {
      term: "ease-in-out の往復(alternate)",
      desc: "端で一度ゆっくり止まりかけてから折り返す動き。等速だと機械的に流れて見え、端で溜めると「ずれたり戻ったり」の揺らぎに見える。",
    },
    {
      term: "em 単位のオフセット",
      desc: "ずれの量を文字サイズ比で持つこと。px で固定すると大きな見出しでは気付かれず、小さな文字では崩れて見える。",
    },
  ],
  titleAct: { act: "glitch-hover", map: { strength: "offset*80", period: "duration" } },
  aliases: ["版ズレ", "ゆらゆら", "じわじわずれる", "刷りずれ", "リソグラフ"],
  related: ["glitch-hover", "halftone", "stamp-in", "line-boil"],
};
