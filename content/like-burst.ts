import type { MotionEntry } from "@/lib/types";

export const likeBurst: MotionEntry = {
  slug: "like-burst",
  category: "ui",
  nameJa: "いいねボタンの弾け（ハートバースト）",
  nameEn: "like button animation / heart burst / favorite toggle",
  lede: "いいね・お気に入りをONにした瞬間、円が広がって消え、その中からハートが小さく生まれ直し、周りに粒が等間隔で弾ける3段の演出。円→ハート→粒の出番をずらすことが要点で、OFFに戻すときは何も弾けさせないことで「押した側」だけが報われる。",
  params: [
    {
      key: "count",
      label: "count(粒の方向数)",
      min: 4,
      max: 12,
      step: 1,
      default: 8,
      desc: "粒を飛ばす方向の数。各方向に大小2粒を少し角度をずらして出す。8方向（45°おき）が定番で、6以下は寂しく、12を超えると輪に見えて粒の弾け感が消える。",
    },
    {
      key: "spread",
      label: "spread(粒の飛距離 px)",
      min: 16,
      max: 64,
      step: 2,
      default: 32,
      desc: "大きい粒がアイコン中心から飛ぶ距離。アイコン径の0.6〜0.8倍が自然（48pxのアイコンで32px前後）。大きすぎるとアイコンから切り離されて別の演出に見える。",
    },
    {
      key: "duration",
      label: "duration(全体の尺 s)",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.5,
      desc: "円の広がりから粒が消え切るまで。0.4〜0.6sが指に遅れない上限。内訳は円0〜60%、ハート40〜70%、粒20〜100%で、尺を変えても比率は保つ。",
    },
    {
      key: "startScale",
      label: "startScale(ハートの出だしの大きさ)",
      min: 0,
      max: 0.8,
      step: 0.05,
      default: 0.2,
      desc: "ハートが生まれ直すときの初期スケール。0.2前後で「中から湧いた」に見える。0.6を超えると膨らみが小さく、ただの色替えに近づく。",
    },
  ],
  promptTemplate: `いいね（お気に入り）ボタンに like button animation(heart burst)を実装してください。

- ボタンは OFF/ON のトグル。aria-pressed で状態を持ち、演出は OFF→ON の瞬間だけ再生する（ON→OFF は色を戻すだけで弾けさせない）
- 全体の尺は {{duration}}s。3つの層を時間差で重ねる
  1. 円：アイコンと同径の塗り円を scale(0.2)→scale(1) へ広げ、尺の 0〜60% で再生。後半で opacity 1→0 に抜く
  2. ハート：塗りのハートを scale({{startScale}})→scale(1) へ戻す。尺の 40〜70% で再生し、開始までは animation-fill-mode: backwards で縮んだ姿のまま待たせる（円に隠れて生まれ直す見え方にする）
  3. 粒：{{count}} 方向に等間隔（360/{{count}}° おき）で、各方向に大粒と、角度を +10° ずらした小粒を置く。大粒は中心から {{spread}}px、小粒は {{spread}}px の約0.25倍から0.9倍まで飛ばし、小粒は scale(0.5) まで縮める。尺の 20〜100% で再生
- 粒は rotate(var(--angle)) translateX(...) の transform だけで飛ばす（top/left を動かさない＝リフロー禁止）。角度は粒ごとに CSS カスタムプロパティで渡す
- 連打で ON に戻ったときは粒と円を必ず頭から再生し直す（要素を key で作り直すか、animation を一度外して付け直す）
- ボタンのヒット領域は粒の飛ぶ範囲ではなくアイコン周り 44px 以上に固定し、粒は pointer-events: none にする
- prefers-reduced-motion 時は円・粒・スケールを一切出さず、ハートの塗りと件数表示の切り替えだけで状態を伝える`,
  ngExample: {
    say: "「いいねボタンを押したらハートがポンってなるようにして」",
    why: "何が・どの順で弾けるかが決まらない。scale(1.3) に膨らむだけのバウンドか、紙吹雪を全方向ランダムに撒く実装が返ってきがちで、円・ハート・粒の時間差が無いぶん「ボタンが揺れた」以上に見えない。OFFに戻す操作でも同じ演出が鳴る実装も多い。",
  },
  okExample: {
    say: "「like button animation を0.5sで。円をscale 0.2→1で0〜60%に広げて抜く、ハートは40〜70%でscale 0.2→1（それまでfill backwardsで縮めて待機）、粒は8方向×大小2粒（小は+10°）を20〜100%でtranslateX 32pxへ。ONの瞬間だけ再生・連打は頭から・reduced-motionは塗り替えだけ」",
    why: "3層それぞれの尺の区間・始点スケール・粒の方向数と飛距離・再生条件まで指定。「OFF→ONの瞬間だけ」と「fill backwardsで待機」の2点で、弾けが押した瞬間の報酬として正しく鳴る。",
  },
  vocab: [
    {
      term: "like button animation / heart burst",
      desc: "いいね・お気に入りのONで円・ハート・粒が時間差で弾けるマイクロインタラクション。英語圏では like animation、Twitter heart animation の名で通じる。",
    },
    {
      term: "toggle microinteraction",
      desc: "2状態を切り替えるボタンに付ける小さな演出。片方向（ON）だけを華やかにし、戻す操作は静かにするのが定石。",
    },
    {
      term: "animation-fill-mode: backwards",
      desc: "animation-delay の待ち時間中も 0% のキーフレームの姿を保つ指定。遅れて出るハートを「縮んだまま待たせる」ために使う。",
    },
    {
      term: "radial particles",
      desc: "角度を等分して中心から外へ飛ばす粒。rotate(角度) のあと translateX(距離) の順に transform を書くと、1本のキーフレームで全方向に使い回せる。",
    },
    {
      term: "aria-pressed",
      desc: "トグルボタンの ON/OFF を支援技術に伝える属性。演出を止めても状態はここと色で伝わる。",
    },
  ],
  related: ["confetti-burst", "floating-reactions", "press-feedback"],
};
