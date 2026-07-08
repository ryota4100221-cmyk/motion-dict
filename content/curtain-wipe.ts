import type { MotionEntry } from "@/lib/types";

export const curtainWipe: MotionEntry = {
  slug: "curtain-wipe",
  category: "transition",
  nameJa: "カーテンワイプ",
  nameEn: "curtain wipe / page transition",
  lede: "ページ切り替え時に無地のカーテンが画面を覆い、引けると次のページが現れているトランジション。覆っている間に読み込みやDOM差し替えを隠せるうえ、覆われた一瞬がリズムの「間」になる。短冊に分割して時間差をつけると布らしい柔らかさが出る。",
  params: [
    {
      key: "duration",
      label: "duration(片道の時間 s)",
      min: 0.3,
      max: 1.5,
      step: 0.05,
      default: 0.8,
      desc: "覆う・引けるそれぞれの所要時間。遷移全体では約2倍かかる点に注意。",
    },
    {
      key: "panels",
      label: "panels(カーテンの枚数)",
      min: 1,
      max: 4,
      step: 1,
      default: 1,
      desc: "2以上で縦の短冊に分割され、1枚ずつ60msの時間差で動く。",
    },
    {
      key: "direction",
      label: "direction(進行方向)",
      min: 0,
      max: 2,
      step: 1,
      default: 0,
      options: ["left", "right", "up"],
      desc: "カーテンが流れていく方向。leftなら右から現れて左へ抜ける。",
    },
  ],
  promptTemplate: `ページ遷移に curtain wipe を実装してください。

- 画面全体を覆う固定レイヤー(position: fixed、最上位のz-index)をカーテンにする
- カーテンは {{panels}} 枚の縦短冊に分割し、各短冊を60msずつずらして動かす
- 覆う動きは transform の scaleX/scaleY を 0→1 に {{duration}}s、進行方向は {{direction}}
- easingは cubic-bezier(0.77, 0, 0.175, 1) のようなease-in-out系を使う
- 完全に覆った瞬間にページ内容を差し替え、transform-originを反対側の辺に反転して同じ {{duration}}s で引く
- widthやclip-pathではなくtransformで動かし、遷移完了後はカーテンをdisplay: noneにする
- prefers-reduced-motion 時はカーテンを出さず、即時切り替えまたは短いフェードにする`,
  ngExample: {
    say: "「ページが切り替わるときにかっこいいトランジションを入れて」",
    why: "何が・どの方向へ・どれだけの時間動くかがすべて未定義。覆ったままカーテンが消えない、差し替えのタイミングがずれて次のページがチラッと見える、といった事故が起きやすい。",
  },
  okExample: {
    say: "「curtain wipeを実装。paper色の縦3枚短冊をscaleXで右から左へ、各0.8s・60msずらし。完全に覆った瞬間にDOMを差し替え、originを反転して引く。reduced-motionは即時切替」",
    why: "分割数・方向・時間・差し替えタイミング・終了時挙動まで揃っている。「完全に覆った瞬間に差し替え」の一言がチラつき事故を防ぐ。",
  },
  vocab: [
    {
      term: "transform-origin反転",
      desc: "覆うときと引けるときで基準辺を入れ替えると、カーテンが同じ方向へ通り抜けて見える。反転を忘れると来た道を戻る動きになり違和感が出る。",
    },
    {
      term: "短冊分割(stagger)",
      desc: "カーテンを数枚に割り、時間差で動かす手法。1枚のベタ塗りより奥行きと柔らかさが出る。時間差は50〜80msが目安。",
    },
    {
      term: "差し替えタイミング",
      desc: "新しいページのDOM入れ替えは画面が完全に覆われている間に行う。ここがずれると切り替え前後の内容が一瞬混ざって見える。",
    },
    {
      term: "片道と往復",
      desc: "指定したdurationは片道分。覆う+引くで体感は2倍になるため、合計1.5s前後に収まるよう逆算して決める。",
    },
  ],
  related: ["crossfade", "clip-reveal", "split-text-reveal"],
};
