import type { MotionEntry } from "@/lib/types";

export const holdToConfirm: MotionEntry = {
  slug: "hold-to-confirm",
  category: "ui",
  nameJa: "長押しで確定（押し続けるとリングが満ち、離すと戻る）",
  nameEn: "hold to confirm / press and hold button / long-press to confirm / hold-to-delete",
  lede: "押している間だけボタンの周りのリングが満ちていき、満ちきったら確定、途中で離せば満ちた分が素早く引いて元に戻る。削除・送金・封を切るなど「うっかり押しでは困る」操作に、確認ダイアログの代わりに置く作法で、肝は満ちる速さより戻る速さを3倍ほど速くすることと、押している間だけ小刻みに震わせて「力がかかっている」と見せることにある。",
  params: [
    {
      key: "holdTime",
      label: "holdTime(満ちるまで押し続ける時間 s)",
      min: 0.4,
      max: 3,
      step: 0.1,
      default: 1.1,
      desc: "空から満ちきるまでの時間。観察元は1.1s。0.8〜1.5sで「わざと押している」と感じられ、0.5sを切るとただのクリックと区別がつかず、2sを超えると壊れたかと思われる。",
    },
    {
      key: "drainTime",
      label: "drainTime(離したとき満タンから空に戻る時間 s)",
      min: 0.1,
      max: 1.5,
      step: 0.05,
      default: 0.35,
      desc: "途中で離したときに満ちた分が引いていく速さ(満タンからなら0.35sで空)。観察元は0.35sで、満ちる速さの約3倍。満ちるのと同じ速さで戻すと、離したのに確定しそうに見えて不安になる。",
    },
    {
      key: "shake",
      label: "shake(押している間の震え deg)",
      min: 0,
      max: 4,
      step: 0.1,
      default: 1.2,
      desc: "押している間だけ0.11s周期で左右に揺らす回転角(位置も±0.7px動く)。観察元は1.2°。0.8〜1.5°で「力がこもっている」感じになり、3°を超えると壊れかけに見える。0で震えなし。",
    },
    {
      key: "burst",
      label: "burst(確定の光が広がる倍率)",
      min: 1.2,
      max: 2.5,
      step: 0.1,
      default: 1.7,
      desc: "満ちきった瞬間にボタンの後ろの光が scale(0.6) から広がって消える最終倍率。観察元は1.7倍・1.2s。1.4〜1.8倍で「切れた」と分かる。",
    },
  ],
  promptTemplate: `削除・送信など取り消しにくい操作のための hold to confirm(長押しで確定するボタン)を実装してください。

- きっかけ: 丸いボタンを押し続ける(PC はマウスの左ボタン・スマホは指で押したまま・キーボードは Enter / Space を押したまま)。押している間だけリングが満ち、満ちきったら確定。途中で離すと戻る。1回確定すると {{burst}} 倍の光が消えたあと1s待って0.7sで空に戻り、また押せる
- 進み具合 progress(0〜1)を requestAnimationFrame で毎フレーム更新する。押している間は progress += 経過ms / ({{holdTime}}×1000)、離している間は progress -= 経過ms / ({{drainTime}}×1000)。1フレームの経過は最大64msで打ち切る(タブ復帰で一気に満ちないように)
- リング: ボタンより一回り大きい SVG の円(pathLength="1"・stroke-dasharray: 1)を rotate(-90deg) で12時始まりにし、stroke-dashoffset を 1 − progress にする。CSS transition は付けない(値は毎フレーム書く)
- 押している間はボタン本体に @keyframes を 0.11s linear infinite で掛ける：25% translate(−0.7px, 0.4px) rotate(−{{shake}}deg)、75% translate(0.7px, −0.4px) rotate({{shake}}deg)。離したら外す
- progress が1に達したら確定：押下を打ち切り、ボタンの後ろの光(放射グラデーションの円)を opacity 0・scale(0.6) → 25% で opacity 1・scale(1.1) → 100% で opacity 0・scale({{burst}}) と 1.2s cubic-bezier(0.22, 1, 0.36, 1) で1回再生し、確定の処理を呼ぶ。確定から1s後に progress を 1 − n²(n は0.7sで0→1)で空へ戻す
- 押して350ms未満で離したら「もう少し長く押してください」と一言出す(クリックで済むと思った人への案内)
- pointerdown で setPointerCapture し、pointerup / pointercancel / lostpointercapture で離した扱いにする。touch-action: none と contextmenu の preventDefault で、長押しのメニュー・スクロールを止める
- 状態は aria-live の一行で読み上げる(押している間・確定した)。動かすのは transform・opacity・stroke-dashoffset だけ
- prefers-reduced-motion 時は震えと光を出さず、押した瞬間にリングを満たして確定し、0.2s後に空へ戻す`,
  ngExample: {
    say: "「削除ボタンを長押しで確定にして」",
    why: "setTimeout で1秒後に確定するだけの実装が返ってきやすく、押している間に何も変わらないので、ユーザーは押し続けていいのか分からず途中で離す。離したら戻るのか、どれくらい押せば良いのかも決まらず、満ちる速さと戻る速さが同じだと離したのに確定しそうに見える。",
  },
  okExample: {
    say: "「押している間だけ周りのリングを1.1sで満たし、離したら0.35sで引いて戻す。押している間は0.11s周期で±1.2°震わせ、満ちたら後ろの光を1.7倍に広げて確定。350ms未満で離したら『もう少し長く』と出す。reduced-motionでは押した瞬間に確定」",
    why: "満ちる・戻るの速さを分けて書いているので「離せば戻る」がはっきり伝わり、押している間の震えとリングで力がかかっていることが見える。短押しへの案内まで指定しているので、普通のボタンだと思って叩いた人も迷わない。",
  },
  vocab: [
    {
      term: "長押し確定(hold to confirm)",
      desc: "一定時間押し続けて初めて実行されるボタン。確認ダイアログを出さずに誤操作を防ぐ。press and hold・hold-to-delete とも呼ばれる。",
    },
    {
      term: "進捗リング(progress ring)",
      desc: "円の輪郭を stroke-dashoffset で少しずつ描いて進み具合を示すもの。pathLength=\"1\" にすると円周を計算せず 0〜1 で書ける。",
    },
    {
      term: "非対称な戻り(asymmetric decay)",
      desc: "満ちる速さと引く速さを変えること。戻りを速くすると「離せば取り消せる」が直感的に伝わる。",
    },
    {
      term: "ポインタキャプチャ(pointer capture)",
      desc: "setPointerCapture で、押したまま指がボタンの外へずれても同じ要素がイベントを受け続けるようにする仕組み。長押し・ドラッグ系の部品で必須。",
    },
    {
      term: "誤操作防止(friction)",
      desc: "取り消しにくい操作にわざと手間を足す設計。長押しは確認ダイアログより手数が少なく、意図の強さをそのまま入力にできる。",
    },
  ],
  titleAct: { act: "loading-bar", map: { duration: "holdTime", height: 3 } },
  aliases: ["ぐーっと押す", "じわじわ", "長押し", "押しっぱなし", "パキッ"],
  related: ["press-feedback", "stateful-button", "circular-progress", "error-shake"],
};
