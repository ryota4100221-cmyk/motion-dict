import type { MotionEntry } from "@/lib/types";

export const receiptPrint: MotionEntry = {
  slug: "receipt-print",
  category: "ui",
  nameJa: "レシート印字（ジジジと刷り出される）",
  nameEn: "receipt print animation / printing receipt / thermal receipt reveal",
  lede: "レシートや明細の紙が、上の差し込み口から1行ずつジジジと刷り出されてくる表示演出。clip-path: inset() の下端を steps() でカクカク送るだけで、なめらかに補間しないことが「機械が紙を送っている」手触りになり、ギザギザの切り口が最後に出て「切り取った紙」に見える。",
  params: [
    {
      key: "duration",
      label: "duration(1枚を刷り切る時間 s)",
      min: 0.4,
      max: 4,
      step: 0.1,
      default: 1.5,
      desc: "紙の上端から下端まで出し切る時間。1.2〜2sで「刷っている」のが読める。0.8sを切ると開くだけに見え、3sを超えると中身を読みたい人を待たせる。",
    },
    {
      key: "lines",
      label: "lines(送りの段数 steps)",
      min: 4,
      max: 60,
      step: 1,
      default: 30,
      desc: "steps(n, end) の n。1回の送りで紙が出る量は高さ÷n。20〜40段で感熱プリンタのジジジに見える。10段以下はガタン、ガタンと大きく跳び、50段を超えるとほぼなめらかになって機械らしさが消える。",
    },
    {
      key: "stagger",
      label: "stagger(隣の紙との刷り始めのずれ ms)",
      min: 0,
      max: 400,
      step: 10,
      default: 90,
      desc: "並んだ紙の animation-delay の差。60〜120msで「順に刷られた」と分かる程度。0だと一斉に、300msを超えると1枚ずつ待たされて見える。",
    },
    {
      key: "teeth",
      label: "teeth(切り口のギザギザの深さ px)",
      min: 0,
      max: 14,
      step: 1,
      default: 7,
      desc: "紙の上下の三角の切り口の高さ(幅はその2倍)。5〜8pxでレシートの切り口に見える。0で普通の長方形の紙、12pxを超えると切手の目打ちのように騒がしい。",
    },
  ],
  promptTemplate: `料金表・注文確認・明細のカードに receipt print(レシートが刷り出される演出)を実装してください。

- きっかけ: 表示した時点で並んだレシート3枚を左から順に刷り出す。「Print again」ボタンを押すと全部を消して最初から刷り直す。誰も触っていなくても、刷り終わってから2.6s置いて自動でもう一度刷り直す(ずっと繰り返す)
- レシートの紙は上辺を「差し込み口」の線に揃えて吊るし、紙の要素に clip-path: inset(0 0 100% 0) を初期値として掛けて隠しておく
- 刷り出し: @keyframes で clip-path を inset(0 0 100% 0) → inset(0) に変える。{{duration}}s・steps({{lines}}, end)・animation-fill-mode both。補間はせず、紙を {{lines}} 段に分けてカクカク送る(ease や linear にしない)
- 3枚は {{stagger}}ms ずつ animation-delay をずらす
- 切り口: 紙の上下に高さ {{teeth}}px・幅 {{teeth}}px×2 の三角のギザギザを mask で抜く(conic-gradient を repeat-x で上下に並べ、中央の帯は linear-gradient で塗る)。clip-path は送り、mask は形、と役割を分けて同じ要素に重ねる
- 動かすのは clip-path だけ。height や max-height を伸ばさない(中の行がリフローして文字が組み直されるのを防ぐ)。紙自体は動かさない
- prefers-reduced-motion 時は刷り出しをせず、紙を最初から全部見せる(自動の刷り直しも止める)`,
  ngExample: {
    say: "「料金表のカードをレシートっぽく出して」",
    why: "「レシートっぽく」では見た目(等幅の文字・点線)だけ真似られ、出方はフェードインか下からのスライドになりやすい。送りを steps() にする指定が無いと height をなめらかに伸ばす実装が返り、中の行がリフローして揺れる上、「刷っている」感じがまったく出ない。",
  },
  okExample: {
    say: "「receipt printを実装。紙を clip-path: inset(0 0 100% 0)→inset(0) で、1.5s steps(30, end) fill both。3枚は90msずつずらす。上下の切り口は7pxのギザギザを mask で抜く。clip-pathだけ動かしheightは触らない。reduced-motionは最初から全部表示」",
    why: "送りを steps の段数で、出す時間とずれを数値で指定しているので、なめらかに開くのではなく感熱プリンタのように行ごとに送られる。clip-path だけを動かす指定で中の文字が組み直されず、切り口の深さまで決めているので紙の質感も揃う。",
  },
  vocab: [
    {
      term: "steps(n, end)",
      desc: "アニメーションを n 段の階段に分け、段の間は補間しないタイミング関数。end は各段の終わりで値が跳ぶ(最初の1段目は 0 のまま待つ)。",
    },
    {
      term: "clip-path: inset()",
      desc: "要素を上・右・下・左からの距離で切り抜く。下の値を 100% → 0 に減らすと、上から下へ見える範囲が広がる。レイアウトは変わらない。",
    },
    {
      term: "deckle / zigzag edge(ギザギザの切り口)",
      desc: "レシートや切り取り式の紙の、刃で切った三角の縁。CSS では conic-gradient を繰り返した mask で抜くのが軽い。",
    },
    {
      term: "thermal printer(感熱プリンタ)",
      desc: "レジのレシートを刷る機械。紙を細かい段で送りながら1行ずつ焼き付けるので、出てくる紙はなめらかではなく小刻みに進む。",
    },
  ],
  titleAct: { act: "sprite-sheet", map: { frames: "lines*0.3", duration: "duration*0.5", loop: 0, timing: 0 } },
  aliases: ["ジジジ", "ガガガ", "レシートが出る", "印刷されて出てくる", "明細"],
  related: ["clip-reveal", "sprite-sheet", "ticket-tear"],
};
