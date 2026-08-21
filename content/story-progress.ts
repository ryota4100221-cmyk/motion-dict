import type { MotionEntry } from "@/lib/types";

export const storyProgress: MotionEntry = {
  slug: "story-progress",
  category: "ui",
  nameJa: "ストーリープログレス",
  nameEn: "story progress bars / segmented progress indicator",
  lede: "Instagramのストーリーで見る、上端に並んだ細いバーが1本ずつ満ちていくインジケーター。「今どこか」と「あと何秒か」を同時に見せられるのが強みで、自動送りのヒーローや推薦コメントの切り替えに効く。",
  params: [
    {
      key: "duration",
      label: "duration(1枚の表示時間 s)",
      min: 1.5,
      max: 8,
      step: 0.5,
      default: 4,
      desc: "短文なら4〜5s、読ませる文章なら6s前後。3sを切ると読み終わる前に送られる。",
    },
    {
      key: "segments",
      label: "segments(セグメント数)",
      min: 2,
      max: 6,
      step: 1,
      default: 4,
      desc: "3〜5本が上限の目安。6本を超えると1本が細くなりすぎて進捗が読み取れない。",
    },
    {
      key: "height",
      label: "height(バーの太さ px)",
      min: 1,
      max: 6,
      step: 1,
      default: 3,
      desc: "2〜3pxが定番。1pxは背景に負けて消え、5px以上はコンテンツより目立ってしまう。",
    },
  ],
  promptTemplate: `自動送りスライダーに story progress bars を実装してください。

- スライダーの上端に {{segments}}本のセグメントを等幅・横一列(gapは4px程度)で並べる。1本の高さは {{height}}px
- 各セグメントは「トラック(半透明の下地)」＋「フィル(不透明)」の二重構造にし、フィルを transform: scaleX(0→1) / transform-origin: left で満たす。width のアニメーションは使わない(リフロー禁止)
- 表示中のセグメントだけを {{duration}}s の linear でフィルする。イージングは掛けない(残り時間の表示なので等速でないと嘘になる)
- 進行の管理は CSS transition ではなく経過時間で行い、満了したら次のスライドへ送る。送り終わったセグメントは scaleX(1)、これからのセグメントは scaleX(0) に保つ
- ステージを押している間(pointerdown〜pointerup / touchstart〜touchend)は進行を一時停止し、離したら残り時間から再開する
- セグメント自体を button にして、クリック/タップでそのスライドへ直接ジャンプできるようにする(aria-label に「n枚目」を入れる)
- 現在位置は aria-live ではなく、コンテナに role="group" と aria-label="スライド n / {{segments}}" を持たせて伝える
- prefers-reduced-motion 時は自動送りとフィルのアニメーションを止め、現在位置までのセグメントを塗った静的なインジケーターにして、送りは操作でのみ行う`,
  ngExample: {
    say: "「インスタのストーリーみたいなバーをスライダーの上につけて」",
    why: "見た目だけ真似た、中身のない飾りのバーが返ってくる。実際のスライド送りと同期していない・停止できない・イージングが掛かっていて残り時間が読めない、のどれかになりやすい。ストーリーバーの本体は「残り時間の可視化」なので、そこが崩れると意味がなくなる。",
  },
  okExample: {
    say: "「story progress barsを4セグメントで実装。各3pxのトラック＋フィルの二重構造、フィルはscaleX(0→1)をtransform-origin:leftで4s linear。経過時間で管理して満了したら次へ自動送り、長押し中は一時停止、セグメントのクリックで直接ジャンプ。reduced-motionでは自動送りを止めて静的表示」",
    why: "構造(二重構造+scaleX)・等速であること・停止と復帰・ジャンプまで指定している。特に「linear」と「長押しで停止」は、指定しないとまず落ちる2点。",
  },
  vocab: [
    {
      term: "segmented progress",
      desc: "全体をn等分し、1区間ずつ満たしていく進捗表示。「全体の何割か」と「今が何枚目か」を1つのUIで両立させる。",
    },
    {
      term: "linear easing",
      desc: "等速。残り時間を表すバーにease-outを掛けると、実際より早く終わりそうに見えて体感が狂う。時間の可視化には等速を使う。",
    },
    {
      term: "hold to pause",
      desc: "押している間だけ停止する操作。ストーリーUIの事実上の標準で、読み切れなかった利用者の唯一の逃げ道になる。",
    },
    {
      term: "transform-origin: left",
      desc: "scaleXの伸び始めの起点。指定しないと中央から左右に開いてしまい、進捗バーに見えなくなる。",
    },
  ],
  related: ["carousel", "loading-bar", "stepper"],
};
