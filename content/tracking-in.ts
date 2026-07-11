import type { MotionEntry } from "@/lib/types";

export const trackingIn: MotionEntry = {
  slug: "tracking-in",
  category: "text",
  nameJa: "字間リビール",
  nameEn: "tracking in / letter-spacing reveal",
  lede: "広い字間＋薄い状態から、字間が詰まりながらフェードインして1語に収束する見出し演出。ラグジュアリー系・ブランドサイトのFVの定番で、easeの設計ひとつで高級にも安っぽくもなる。",
  params: [
    {
      key: "duration",
      label: "duration(収束時間 s)",
      min: 0.4,
      max: 2.5,
      step: 0.1,
      default: 1.2,
      desc: "1〜1.5sがFV向き。0.6s以下は「詰まる」過程が見えず、ただのフェードに見える。",
    },
    {
      key: "spread",
      label: "spread(開始字間 em)",
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.5,
      desc: "0.4〜0.6emが上品。1em近くまで広げると劇的だが、長い単語は画面からはみ出す。",
    },
    {
      key: "ease",
      label: "ease(収束カーブ)",
      min: 0,
      max: 2,
      step: 1,
      default: 1,
      options: ["ease-out", "expo-out", "ease-in-out"],
      desc: "expo-out(序盤に一気に詰まり終盤ゆっくり収束)が最も高級に見える定番。",
    },
  ],
  promptTemplate: `見出しに tracking in を実装してください。

- 初期状態は letter-spacing {{spread}}em・opacity 0、最終状態は letter-spacing 0.02em・opacity 1
- {{duration}}s かけて letter-spacing と opacity を同時に transition させる。easeは {{ease}}(expo-outは cubic-bezier(0.16, 1, 0.3, 1))
- 見出しは中央揃えにし、最後の文字の後ろに付く letter-spacing ぶんだけ margin-right をマイナスして収束の中心がずれないようにする
- letter-spacing のアニメーションはリフローを伴うため、対象は1行の短い見出しに限定する。段落や複数要素に使う場合は文字を分割して translateX で寄せる方式に切り替える
- 発火はページロード直後、またはIntersectionObserverで画面に入った1回だけ。ループさせない
- prefers-reduced-motion 時はアニメーションなしで最終状態(詰まった字間・不透明)を即表示する`,
  ngExample: {
    say: "「タイトルの文字がシュッと集まって出てくるようにして」",
    why: "「シュッと」では開始字間もeaseも決まらない。文字がバラバラに飛んでくる過剰な実装や、opacityフェードだけで字間が動かない実装が返ってきがち。中央収束の補正も入らず、収束先が左にずれる。",
  },
  okExample: {
    say: "「tracking inを実装。letter-spacing 0.5em→0.02em・opacity 0→1を1.2s、cubic-bezier(0.16,1,0.3,1)で同時にtransition。中央揃えでmargin-right補正、画面に入った1回だけ発火、reduced-motion時は最終状態を即表示」",
    why: "開始・終了の字間とease・発火タイミングまで数値で指定。「margin-right補正」の一言がないと、収束の中心が左へずれた微妙な仕上がりになる。",
  },
  vocab: [
    {
      term: "tracking",
      desc: "欧文組版で字間全体を均等に開閉すること。CSSでは letter-spacing。1文字ごとの調整(kerning)とは区別される。",
    },
    {
      term: "expo-out",
      desc: "序盤が極端に速く終盤が長いイージング。cubic-bezier(0.16, 1, 0.3, 1)が定番。「勢いよく集まり、静かに収束する」高級系の要。",
    },
    {
      term: "末尾スペース補正",
      desc: "letter-spacingは最後の文字の後ろにも付くため、中央揃えだと視覚上左にずれる。同量のマイナスmargin-rightで打ち消す。",
    },
    {
      term: "リフロー",
      desc: "レイアウトの再計算。letter-spacingのアニメはこれを伴うため、長文や画面全体には使わず短い見出しに限定する。",
    },
  ],
  related: ["split-text-reveal", "blur-reveal", "wave-text"],
};
