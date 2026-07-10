import type { MotionEntry } from "@/lib/types";

export const preloaderCounter: MotionEntry = {
  slug: "preloader-counter",
  category: "loading",
  nameJa: "プリローダーカウンター",
  nameEn: "preloader counter / loading percentage",
  lede: "サイト初回訪問時に0→100%の数値が駆け上がり、完了と同時に幕が開くAwwwards定番のオープニング。世界観への期待値を上げる演出だが、正体はただの待ち時間。カウントと幕開けの合計3秒以内が絶対条件になる。",
  params: [
    {
      key: "duration",
      label: "duration(カウント時間 s)",
      min: 0.5,
      max: 4,
      step: 0.1,
      default: 1.8,
      desc: "0→100の所要時間。1.5〜2sが目安。幕開けと合わせて3秒を超えたら削る。",
    },
    {
      key: "curtain",
      label: "curtain(幕開け時間 s)",
      min: 0.3,
      max: 2,
      step: 0.05,
      default: 0.8,
      desc: "100到達後にオーバーレイが引き上がる時間。0.6〜1sが気持ちいい。",
    },
  ],
  promptTemplate: `サイト初回表示に preloader counter を実装してください。

- 画面全体を覆うオーバーレイの右下に 0〜100 の数値と%を表示する
- {{duration}}s かけて expo-out でカウントアップする(rAFの経過時間から進捗を計算。setIntervalの+1は不可)
- 100 に到達したらオーバーレイを transform: translateY(-100%) で {{curtain}}s、cubic-bezier(0.76, 0, 0.24, 1) で引き上げて本編を見せる
- カウント+幕開けの合計は3秒以内に収める。実際の読み込みが遅い場合のみ100%で待機する
- 数値に font-variant-numeric: tabular-nums を指定し、桁のガタつきを防ぐ
- 幕は top や height ではなく transform で動かす(リフロー禁止)
- sessionStorage で初回訪問のみ表示し、2回目以降はスキップする
- prefers-reduced-motion 時はプリローダーを表示せず本編を即表示する`,
  ngExample: {
    say: "「最初にかっこいいローディング画面を出して」",
    why: "何秒待たせるか・何と連動するか・毎回出すのかが全部未定義。実読み込みと無関係に5秒回り続ける演出や、ページ遷移のたびに出るプリローダーが返ってきて、直帰率を確実に上げる。",
  },
  okExample: {
    say: "「preloader counterを実装。0→100を1.8s expo-out、右下にtabular-numsで表示、完了後translateY(-100%)を0.8sで幕開け、合計3秒以内、sessionStorageで初回のみ、reduced-motion時は非表示」",
    why: "時間・イージング・幕開けの実装方式・表示頻度まで指定している。「初回のみ」と「合計3秒以内」の2つがUX事故を防ぐ生命線。",
  },
  vocab: [
    {
      term: "プリローダー",
      desc: "本編表示前に挟む読み込み演出の総称。世界観の予告編であると同時に、ユーザーにとっては純粋な待ち時間。",
    },
    {
      term: "幕開け(curtain reveal)",
      desc: "カウント完了後にオーバーレイを引き上げて本編を見せる動き。translateYで動かし、easeは強めの減速系が定石。",
    },
    {
      term: "体感待ち時間",
      desc: "実際の秒数ではなくユーザーが感じる長さ。数値が動いている間は短く感じるが、3秒を超えると逆効果になる。",
    },
    {
      term: "sessionStorage",
      desc: "「初回訪問のみ表示」の制御に使うブラウザ保存領域。タブを閉じるまで残るため、サイト内回遊中の再表示を防げる。",
    },
  ],
  related: ["counter", "curtain-wipe", "loading-bar"],
};
