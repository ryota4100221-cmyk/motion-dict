import type { MotionEntry } from "@/lib/types";

export const scrollUnroll: MotionEntry = {
  slug: "scroll-unroll",
  category: "media",
  nameJa: "巻物がほどける（スクロールアンロール）",
  nameEn: "scroll unroll / unfurl animation / parchment unroll",
  lede: "筒から引き出した紙が、巻いた芯ごと下へ転がりながら開いて中身を見せるリビール。仕組みは「窓と中の紙を逆向きに動かす切り開き」と芯の translateY を同じ時間・同じイージングで走らせるだけで、「巻物らしさ」は開く縁に乗った芯の陰影と、先に飛ぶキャップの前振りで決まる。",
  params: [
    {
      key: "duration",
      label: "duration(ほどける時間 s)",
      min: 0.5,
      max: 2.5,
      step: 0.05,
      default: 1.1,
      desc: "0.9〜1.4sが目安。出典は1.1s。0.7sを切ると芯が「転がる」より「落ちる」に見え、2sを超えると証書の授与のような儀式感が強くなる。",
    },
    {
      key: "lead",
      label: "lead(ほどけ始めるまでの溜め s)",
      min: 0,
      max: 1.5,
      step: 0.05,
      default: 0.6,
      desc: "押してから紙が動き出すまで。この間にキャップが lead×0.4s 遅れて0.5sで外れる。0.4〜0.8sで「筒を開けてから引き出す」順序が伝わる。0だとキャップと紙が同時に動いて前振りが消える。",
    },
    {
      key: "rollSize",
      label: "rollSize(芯の太さ px)",
      min: 4,
      max: 28,
      step: 1,
      default: 16,
      desc: "開く縁に乗る巻いた紙の太さ。紙の幅の3%前後(幅500pxなら14〜18px)が自然。細すぎると縁に引いた線にしか見えず、clip-pathのリビールと区別がつかない。",
    },
  ],
  promptTemplate: `証書・地図・招待状などの紙ものの表示に scroll unroll(巻物がほどける)を実装してください。

- きっかけ: 「Unroll」ボタンか、巻かれた紙の部分をクリック/タップすると1回ほどける(本番ではモーダルを開いた瞬間に1回自動で)。開いた後にもう一度押すと同じ時間・同じイージングで巻き上げて元に戻す。動いている間の操作は無視する
- 構成: 上に筒(横長の棒)、その右端にキャップ、筒の下に紙(画像)、紙の上に重ねて芯(巻いた紙の太さ {{rollSize}}px の横棒)。芯は紙より左右に1%ずつはみ出させ、上下方向のグラデーション(明→暗)で円柱の陰影を付ける
- 切り開き: 紙の置き場(overflow: hidden)の中に同寸の窓(overflow: hidden)を置き、その中に紙を入れる。窓を translateY(-100%) → translateY(0)、紙を translateY(100%) → translateY(0) と逆向きに同量動かすと、画面上の紙は止まったまま上端から下へ切り開かれる
- 芯は紙と同じ大きさの外枠に入れて translateY(0) → translateY(100%) で動かし、芯の中心が常に開いた縁に乗るようにする(芯自体は translateY(-50%) で縁に中心を合わせる)
- 窓・紙・芯の3つは必ず同じ {{duration}}s・同じ cubic-bezier(0.3, 0.6, 0.3, 1)・同じ遅延 {{lead}}s で走らせる。どれかがずれると、芯が紙から離れて「線が下りてくるだけ」に見える
- 切り開きを clip-path: inset() のアニメーションで作らない。clip-path はメインスレッドで描かれ、コンポジタで動く芯の transform と負荷時にずれて、芯が縁より先に下りる
- 前振り: キャップは押した {{lead}}×0.4 s 後から0.5sの cubic-bezier(0.5, 0, 0.7, 0.4) で外れる(40%で右上へ translate(12px, −8px) rotate(20deg)、100%で右下へ translate(36px, 30px) rotate(70deg) opacity 0)。巻き上げが終わったら0.25sのフェードで元の位置に戻す
- 動かすのは transform と opacity だけ(top / height / clip-path はアニメーションさせない)
- prefers-reduced-motion 時はキャップも芯も動かさず、紙を開いた状態/巻いた状態に即座に切り替える`,
  ngExample: {
    say: "「卒業証書がくるくるっと開く感じで出して」",
    why: "何が転がるのかが決まらない。紙をscaleYで縦に伸ばして文字ごと潰れる実装や、ただ上から下へ clip-path で切り開くだけ(芯が無い)のリビールが返ってきがち。芯を付けても、切り開きを clip-path・芯を transform で動かすと描かれるスレッドが違い、芯が縁より先に下りて離れる。",
  },
  okExample: {
    say: "「scroll unrollを実装。overflow:hiddenの窓をtranslateY(-100%→0)、中の紙を(100%→0)と逆に動かして切り開き、芯(16px・上下グラデ)は紙と同寸の外枠でtranslateY(0→100%)。3つとも1.1s cubic-bezier(0.3,0.6,0.3,1)・遅延0.6s。clip-pathは使わない。キャップは0.24sから0.5sで右下へ飛ばす。reduced-motionは即切替」",
    why: "切り開きと芯を同じ時間・同じイージング・同じ遅延で、しかも全部 transform で走らせる、という一番ずれやすい点を固定している。芯を「紙と同寸の外枠の translateY(100%)」で動かすので、紙の高さが変わっても縁から外れない。",
  },
  vocab: [
    {
      term: "unroll / unfurl",
      desc: "巻いたものを広げること。unfurlは旗や帆が風で広がるニュアンスも含む。UIでは証書・地図・巻物を開く演出の呼び名として通じる。",
    },
    {
      term: "芯(roller / rod)",
      desc: "開く縁に乗っている、巻いた紙の太さぶんの棒。これがあるだけで、ただのマスクの切り開きが「紙が転がってほどける」動きに読み替わる。",
    },
    {
      term: "同期(lockstep)",
      desc: "複数の要素を同じ時間・同じイージング・同じ遅延で動かし、互いの位置関係を保つこと。値が同じでも、片方が clip-path(メインスレッド)・片方が transform(コンポジタ)だと描かれるタイミングがずれるので、同じ種類のプロパティで揃える。",
    },
    {
      term: "逆向きの入れ子(counter-translate)",
      desc: "overflow: hidden の窓を動かし、中身を同じ量だけ逆へ動かす手法。中身は画面上で止まったまま、見える範囲だけが広がる。clip-path を使わずに transform だけで切り開ける。",
    },
    {
      term: "前振り(anticipation)",
      desc: "本番の動きの直前に置く小さな予告の動き。ここではキャップが先に外れて飛ぶことで、「これから中身が出てくる」と目を準備させる。",
    },
    {
      term: "cubic-bezier(0.3, 0.6, 0.3, 1)",
      desc: "出だしがやや速く、終端でゆっくり止まるイーズアウト寄りの曲線。重みのある紙が自重で転がり、最後にふわりと止まる印象になる。",
    },
  ],
  titleAct: { act: "clip-reveal", map: { duration: "duration", direction: 1 } },
  aliases: ["くるくる", "スルスル", "巻物", "証書が開く", "ほどける"],
  related: ["clip-reveal", "page-turn", "torn-paper-reveal"],
};
