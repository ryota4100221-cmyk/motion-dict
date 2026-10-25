import type { MotionEntry } from "@/lib/types";

export const paperCrumple: MotionEntry = {
  slug: "paper-crumple",
  category: "ui",
  nameJa: "紙を丸めて捨てる（クシャッと破棄）",
  nameEn: "paper crumple / crumple and toss / crumple delete animation",
  lede: "捨てる書類を、輪郭のギザギザな多角形へ縮めながら左右にねじり、しわの影を浮かせて紙玉にしてから放り投げる破棄演出。フェードで消すより「これはもう要らない」という意思がはっきり伝わり、プラン切り替えや下書きの削除のような取り消せる破棄に向く。",
  params: [
    {
      key: "duration",
      label: "duration(丸め始めから投げ終わりまで s)",
      min: 0.3,
      max: 1.6,
      step: 0.05,
      default: 0.65,
      desc: "観察元(designbyency.com)は0.65s。うち前7割で丸め、後ろ3割で投げる。0.5〜0.8sが自然で、1sを超えると捨てるのを待たされる。",
    },
    {
      key: "ball",
      label: "ball(丸め終わりの大きさ 元の紙比)",
      min: 0.06,
      max: 0.3,
      step: 0.01,
      default: 0.12,
      desc: "紙玉の見た目の幅が元の紙の何割か。0.1〜0.15で「手のひらに収まる玉」に見える。0.25を超えると畳んだだけに見え、丸めた感じが消える。",
    },
    {
      key: "wrinkle",
      label: "wrinkle(輪郭のギザギザ %)",
      min: 0,
      max: 12,
      step: 0.5,
      default: 6,
      desc: "clip-pathの12頂点を内外へずらす量。観察元は4〜9%相当。0だと四角いまま縮むだけで紙に見えず、10%を超えると星形に尖る。",
    },
    {
      key: "toss",
      label: "toss(投げる距離 px)",
      min: 0,
      max: 320,
      step: 10,
      default: 180,
      desc: "紙玉を放る水平距離。ゴミ箱やアーカイブの位置へ向けると行き先が伝わる。0ならその場で落ちて消える。",
    },
  ],
  promptTemplate: `破棄する紙カード(レシートや下書き)に paper crumple(丸めて捨てる)を実装してください。

- きっかけ: 紙カード本体のクリック(Enter/Spaceも可)か「破棄」ボタンで1回再生する。タッチはタップで同じ動作。再生中の追加クリックは無視する
- 全体 {{duration}}s。0〜68%で丸め、80%地点で一瞬下へ6px沈ませて溜め(scale を1.08倍・縦0.96倍)、80〜100%で投げる
- 丸めは clip-path: polygon() の12頂点(各辺に4点)を、角から中心へ段階的に寄せて作る。各頂点は中心からの距離を±{{wrinkle}}%ずつ互い違いにずらし、輪郭をギザギザにする
- 同時に transform で scale を縮め、rotate を 13%:-2deg → 28%:4deg → 43%:-7deg → 57%:9deg → 68%:-5deg と左右交互に振ってねじれを出す。丸め終わりの見た目の幅は元の紙の {{ball}} 倍にする
- しわは ::after に半透明の linear-gradient を数本重ねた影で描き、丸め始めの14%で opacity 0→0.7 まで一気に上げ、30%で1にしてそのまま保つ
- 投げは translate で水平に {{toss}}px、下へ ({{toss}}×0.4+24)px 落としつつ rotate を260degほど回し、opacity を0にする
- clip-path と transform と opacity だけで動かし、width/height は変えない(リフロー禁止)。clip-pathの頂点数は全キーフレームで揃える(数が違うと補間されない)
- 各キーフレームに easing を個別に指定する(丸めは cubic-bezier(0.7,0,0.3,1)、投げは cubic-bezier(0.5,0,0.9,0.5))
- 捨てた後に次の紙を出す場合は、投げ終わって0.22s後に出す(同時に出すと捨てた物が見えない)
- prefers-reduced-motion 時は丸めも投げもせず、0.2sのフェードアウトで消す`,
  ngExample: {
    say: "「削除するとき紙をクシャッとして捨てる感じにして」",
    why: "「クシャッと」の作り方が決まらないので、scaleで縮めて回すだけ(四角いまま小さくなる)か、WebGLや連番画像の重い実装が返ってくる。輪郭が崩れないと紙を丸めたようには見えない。",
  },
  okExample: {
    say: "「paper crumpleで破棄。0.65s、clip-pathの12頂点を中心へ寄せつつ±6%ずらしてギザギザに、rotateを左右交互に振って幅0.12倍の玉に。::afterのしわ影を最初の15%で出し、最後に右へ180px放って回転しながら消す。transform・clip-path・opacityのみ、reduced-motionはフェードのみ」",
    why: "輪郭を崩す手段(頂点数を揃えたpolygon)・ねじり・しわ・投げの4要素と数値まで指定している。「頂点数を揃える」の一言が、補間されずにパッと切り替わる事故を防ぐ。",
  },
  vocab: [
    {
      term: "clip-path: polygon()",
      desc: "要素を多角形で切り抜く。頂点数が同じなら座標同士が補間されるので、四角→ギザギザの塊へ連続的に変形できる。",
    },
    {
      term: "頂点数の一致",
      desc: "polygon同士のアニメーションは頂点の数が揃っているときだけ滑らかに補間される。数が違うと途中経過なしで切り替わる。",
    },
    {
      term: "crease(しわ・折り目)",
      desc: "丸めた紙に出る折れ線。斜めの硬いグラデーションを数本重ねた影で描くと、形が崩れるのと同時に「紙らしさ」が出る。",
    },
    {
      term: "anticipation→follow-through",
      desc: "丸める(溜め)→投げる(放出)の2段構成。丸め終わりに一瞬止めてから投げると、捨てる意思が読み取れる。",
    },
    {
      term: "破棄のフィードバック",
      desc: "削除が実行されたことを形で示す演出。消えた物がどこへ行ったかを見せると、取り消し(Undo)の存在にも気付かせやすい。",
    },
  ],
  titleAct: { act: "paper-crumple" },
  aliases: ["クシャッ", "くしゃくしゃ", "ポイッ", "丸める"],
  related: ["list-add-remove", "swipe-dismiss", "sticker-peel", "fly-to-cart"],
};
