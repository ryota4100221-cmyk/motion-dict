import type { MotionEntry } from "@/lib/types";

export const steamRise: MotionEntry = {
  slug: "steam-rise",
  category: "ui",
  nameJa: "湯気（ゆらゆら立ちのぼる）",
  nameEn: "rising steam / steam animation / steaming cup",
  lede: "カップや皿の上に S 字の細い線を数本立て、線が下から描かれては上へ抜けて消える動きを、時間をずらして繰り返す演出。破線の「描かれている区間」を線に沿って下から上へ送り、同時に少し持ち上げてフェードさせるだけで、「いま温かい」「できたて」が絵1枚に乗る。",
  params: [
    {
      key: "duration",
      label: "duration(1本が立って消えるまでの時間 s)",
      min: 1.2,
      max: 8,
      step: 0.1,
      default: 3.2,
      desc: "1本の線が下から現れ、上へ抜けて消えるまで。2.5〜4sが湯気らしい速さ。1.5sを切ると煙突の煙や噴射に見え、6sを超えるとほぼ止まって見える。",
    },
    {
      key: "stagger",
      label: "stagger(隣の線との時間差 s)",
      min: 0,
      max: 2,
      step: 0.05,
      default: 0.9,
      desc: "左から順に1本ずつ遅らせる量。duration の1/4〜1/3(3.2sなら0.8〜1.1s)が目安で、常にどれか1本が濃く見えている状態が続く。0だと全本が同時に立って消え、点滅に見える。",
    },
    {
      key: "rise",
      label: "rise(1周で持ち上がる量 px)",
      min: 0,
      max: 80,
      step: 1,
      default: 36,
      desc: "1周のあいだに線全体が上へずれる量。湯気の高さの1/4前後(高さ135pxなら30〜40px)が自然。0だと線が描かれて消えるだけで「立ちのぼる」感じが消え、高さの半分を超えると飛んでいく。",
    },
    {
      key: "wisps",
      label: "wisps(湯気の線の本数)",
      min: 1,
      max: 5,
      step: 1,
      default: 3,
      desc: "カップ1つなら3本が定番。1〜2本は線香やろうそくの細い煙に寄り、5本だと鍋や湯船のような大きな湯気になる。",
    },
  ],
  promptTemplate: `カップのイラストの上に steam rise(湯気が S 字の線でゆらゆら立ちのぼる演出)を実装してください。

- きっかけ: 表示した時点から操作なしで立ちのぼり続ける(無限ループ・誰も触らなくても止まらない)。湯気の舞台を押す(クリック/タップ・pointerdown)と一時停止し、もう一度押すと続きから再開する
- 湯気は SVG の線で描く。viewBox 0 0 160 90 の中に S 字の線を {{wisps}} 本、横幅を本数+1 で等分した位置に立てる(3本なら x=40/80/120)。1本の形は d="M<x> 86c-14-14 14-24 0-40s12-26 2-42"(下端から上へ、左右に揺れる曲線)。stroke-width 5・stroke-linecap: round・fill: none
- 湯気の箱は幅240px × 高さ135px(viewBox を1.5倍で表示)。カップの口のすぐ上に、下端を口に少し重ねて置く
- 線ごとに stroke-dasharray: 120(線の長さ約89より長い1区間)とし、stroke-dashoffset を 0%: 120 → 70%: 0 → 100%: -120 と送る。これで「下から描かれて伸び、尾が下から抜けて上へ消える」になる
- 同じ周期で、線(またはそれを包む要素)の opacity を 0%: 0 → 30%: 0.9 → 70%: 0.7 → 100%: 0、transform を 0%: translateY({{rise}}px × 0.4) → 100%: translateY(-{{rise}}px × 0.6) と動かす(1周で計{{rise}}px 持ち上がる)
- 周期は {{duration}}s、animation-timing-function: ease-in-out(キーフレームの区間ごとにかかる)、infinite。n本目(0始まり)に animation-delay: n × {{stagger}}s を付けて左から順に立てる
- 動かすのは stroke-dashoffset・opacity・transform だけ(線の d や位置をフレームごとに書き換えない)
- 湯気の色はカップの線より明るく・アクセント色にしてよい。カップは静止したまま
- prefers-reduced-motion 時はアニメーションを止め、湯気は全部の線を描き切った状態(dashoffset 0・opacity 0.7)で静止させる`,
  ngExample: {
    say: "「コーヒーカップから湯気が出てる感じにして」",
    why: "ぼかした白い楕円を上へ移動させてフェードするだけの実装が返りやすい。形が無いので湯気ではなく「白い煙のかたまり」に見え、全部が同じタイミングで出るので点滅する。線で描く案が来ても stroke-dashoffset を一方向に送るだけで、描き終わった線がそのまま残って消えない。",
  },
  okExample: {
    say: "「steam riseを実装。S字の線を3本、dasharray 120でdashoffsetを120→0→-120と送り、opacity 0→0.9→0.7→0、translateY 14px→-22px。3.2s ease-in-out infinite、0.9sずつずらす。reduced-motionは描き切った状態で静止」",
    why: "線の形・破線の送り方・不透明度の山・持ち上げ量・時間差まで指定しているので、「下から描かれて上へ抜ける」1本ずつの湯気が、どれか1本は常に見えている状態で途切れずに続く。",
  },
  vocab: [
    {
      term: "stroke-dasharray / stroke-dashoffset",
      desc: "線を破線として扱い、その破線の位置をずらす指定。区間を線の長さより長く取り、offset を正→0→負と送ると「描かれて伸び、尾から消える」1回ぶんの線になる。",
    },
    {
      term: "wisp",
      desc: "湯気・煙の一筋。湯気は1本の大きな塊ではなく、細い筋が時間をずらして立っては消える集まりとして描く。",
    },
    {
      term: "animation-delay(時間差)",
      desc: "同じアニメーションを複数の要素に付け、開始をずらす指定。周期の1/4〜1/3ずつずらすと、どの瞬間にも濃い線が1本残り、湯気が途切れて見えない。",
    },
    {
      term: "ease-in-out(区間ごと)",
      desc: "CSS の @keyframes では timing-function がキーフレームの区間ごとにかかる。0→30%→70%→100% の各区間でゆっくり始まりゆっくり終わるので、線が「ふわっ」と濃くなり「すうっ」と消える。",
    },
  ],
  titleAct: { act: "line-draw", map: { duration: "duration", stagger: "stagger" } },
  aliases: ["ゆらゆら", "ほかほか", "ほわほわ", "湯気", "できたて"],
  related: ["line-draw", "fog-drift", "flame-flicker", "ambient-float", "animated-beam"],
};
