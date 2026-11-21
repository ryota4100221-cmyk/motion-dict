import type { MotionEntry } from "@/lib/types";

export const photoDevelop: MotionEntry = {
  slug: "photo-develop",
  category: "media",
  nameJa: "写真の現像（白く飛んだ像がじわっと浮かぶ）",
  nameEn: "photo develop effect / darkroom develop reveal / overexposed fade-in / instant photo developing",
  lede: "写真を、白く飛んで眠い像(明るさを上げ・コントラストを下げた状態)からじわっと元の濃さへ戻して出す、暗室の現像やインスタント写真が浮かび上がる様子を借りた画像の出し方。ぼかしを解く blur-up と違って形は最初から見えており、「露光が決まっていく」時間だけを見せる。複数枚なら中央から外へ時間差を付けると、シート全体が現像液に浸かったように見える。",
  params: [
    {
      key: "duration",
      label: "duration(1枚が焼き上がる時間 s)",
      min: 0.6,
      max: 3,
      step: 0.1,
      default: 1.6,
      desc: "像が出る(不透明度が1になる)のはこの45%の時点で、残りで濃さが締まる。1.2〜2sが「現像を待つ」間として自然。0.8sを切ると白いフラッシュに見え、2.5sを超えると読み込みが遅いだけに見える。",
    },
    {
      key: "exposure",
      label: "exposure(焼き始めの明るさ brightness 倍)",
      min: 1.2,
      max: 4,
      step: 0.1,
      default: 2.6,
      desc: "最初のコマの filter: brightness()。2〜3倍で明部が白く飛び、形だけがうっすら残る。1.5倍以下だと普通のフェードと区別がつかず、3.5倍を超えると真っ白な板が出てから絵に変わる。",
    },
    {
      key: "contrast",
      label: "contrast(焼き始めのコントラスト)",
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.5,
      desc: "最初のコマの filter: contrast()。0.4〜0.6で黒が灰色に浮き、現像途中の眠さが出る。1にすると明るさだけが下がる＝露出補正のように見える。0.2を切ると灰色の板になる。",
    },
    {
      key: "stagger",
      label: "stagger(中央から1コマ離れるごとの遅れ ms)",
      min: 0,
      max: 200,
      step: 10,
      default: 90,
      desc: "遅延 = 150ms + stagger × 中央のコマからの距離(横1コマ=1、縦1段=1.6)。60〜120msで中央から波紋のように広がる。0で全コマ一斉、160msを超えると端のコマがなかなか出ず待たされる。",
    },
  ],
  promptTemplate: `写真の一覧(コンタクトシート・ギャラリー)に photo develop(暗室の現像のように白く飛んだ像から浮かび上がる)演出を実装してください。

- きっかけ: 一覧が表示された時に全コマを1回だけ現像する(繰り返さない)。「Develop again」ボタンを押すと全コマを作り直して最初から現像し直す。1コマをクリック/タップすると、そのコマだけを待ちなしで現像し直す。マウスが乗っている間だけそのコマを明るく起こす(タッチでは明るくせず、タップで焼き直すだけ)
- 各コマの写真を包む要素に CSS アニメーションを1回だけ掛ける: {{duration}}s、animation-timing-function は cubic-bezier(.3, .6, .3, 1)、animation-fill-mode は backwards(待っている間も開始状態で隠す)
- キーフレーム: 0% { opacity: 0; filter: brightness({{exposure}}) contrast({{contrast}}) } → 45% { opacity: 1 } → 100% { opacity: 1; filter: none }。opacity は45%で出し切り、filter は0→100%の1区間で締める(タイミング関数はキーフレームの区間ごとに掛かる)
- 時間差: 中央のコマからの列のずれ dc・行のずれ dr を使い、animation-delay = 150ms + {{stagger}}ms × hypot(dc, 1.6 × dr)。行に1.6を掛けて縦方向の波を少し遅らせ、中央から外へ楕円に広がるようにする
- 焼き上がった写真は opacity 0.8・brightness(0.82) で少し眠らせて並べ、ホバー中のコマだけ 0.5s ease-out で opacity 1・filter none・scale(1.03) にする
- 写真の後ろ(コマの窓)は暗い印画紙の色 #0f0b09 にしておく。opacity 0 の間に白い背景が透けると現像ではなくフラッシュに見える
- モノクロ写真に sepia や色を足さない(暖色にしたいときだけ sepia を開始状態に足して0へ戻す)
- やり直しは要素を作り直す(React なら key を変える)ことでアニメーションを頭から再生する。animation-delay を後から書き換えて再生し直さない
- 動かすのは opacity と filter だけにし、width / height / 位置は変えない(リフローさせない)
- prefers-reduced-motion 時は現像のアニメーションとホバーの補間を無効にし、焼き上がった状態の写真をすぐに表示する`,
  ngExample: {
    say: "「写真がふわっと現れる感じで、昔の写真が現像されるみたいにして」",
    why: "opacity のフェードインだけか、blur(20px)→0 のぼかし解除が返ってくる。「現像」の正体＝明るさを上げてコントラストを下げた白く眠い状態から締まっていくこと、が伝わらない。sepia で茶色に染めて「昔っぽさ」に寄せる解釈も多く、複数枚の時間差も全コマ一斉か左上から順番になる。",
  },
  okExample: {
    say: "「photo developで。写真のラッパーに1.6s cubic-bezier(.3,.6,.3,1) backwards のアニメ、0%は opacity 0・brightness(2.6) contrast(0.5)、45%で opacity 1、100%で filter none。delay は 150ms + 90ms × hypot(列のずれ, 1.6×行のずれ) で中央から外へ。焼き上がりは opacity .8・brightness .82、ホバーで1へ。背景は暗色、sepiaなし、reduced-motionでは即表示」",
    why: "「現像」を brightness と contrast の開始値という2つの数値に置き換え、opacity を45%で出し切る2段の時間配分と、中央からの距離で決める遅延の式まで渡している。背景色と sepia なしの指定で、白いフラッシュや茶色い写真に化けるのを防げる。",
  },
  vocab: [
    {
      term: "photo develop / darkroom reveal",
      desc: "暗室の現像液の中やインスタント写真で、白っぽい紙から像が浮かび上がる過程を借りた画像の出し方。ぼかしではなく露光(明るさ・コントラスト)を戻していく。",
    },
    {
      term: "filter: brightness() / contrast()",
      desc: "brightness は全体の明るさの倍率(2.6で明部が白く飛ぶ)、contrast は明暗差の倍率(0.5で黒が灰色に浮く)。2つを組み合わせると「露出オーバーで眠い」状態が1行で作れる。",
    },
    {
      term: "animation-fill-mode: backwards",
      desc: "animation-delay で待っている間も0%のキーフレームの状態を適用する指定。これが無いと、遅れて始まるコマが一瞬完成状態で見えてから消える。",
    },
    {
      term: "キーフレームごとのタイミング関数",
      desc: "CSS の animation-timing-function はキーフレームの区間ごとに掛かる。opacity を45%に置き filter を0%と100%にだけ書くと、opacity は前半で出し切り、filter は全体で締まる。",
    },
    {
      term: "距離で決める stagger(放射状の時間差)",
      desc: "並び順ではなく、起点のコマからの距離 hypot(dx, dy) に比例して遅らせる。波紋のように広がり、縦横の重みを変えると楕円の波になる。",
    },
  ],
  titleAct: { act: "blur-reveal", map: { blur: 6, duration: "duration", stagger: "stagger" } },
  aliases: ["じわっと", "ぼわっ", "ふわーっと浮かぶ", "現像", "露出オーバーから"],
  related: ["blur-load", "polaroid-drop", "stagger-grid", "flicker-on"],
};
