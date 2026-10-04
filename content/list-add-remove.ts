import type { MotionEntry } from "@/lib/types";

export const listAddRemove: MotionEntry = {
  slug: "list-add-remove",
  category: "ui",
  nameJa: "リスト項目の追加・削除（高さの畳み込み）",
  nameEn: "animated list add / remove / collapse on remove / list item enter-exit",
  lede: "リストから1行を消すとき、行を即座に抜かずに高さを0まで畳み、下の行が詰まってくる様子まで見せる。追加はその逆で、0から開いて押し広げる。どこが消えてどこが増えたかを目で追えるので、カートやTODOの操作が「何も起きていないように見える」事故を防げる。",
  params: [
    {
      key: "duration",
      label: "duration(畳む・開く時間 s)",
      min: 0.1,
      max: 0.8,
      step: 0.05,
      default: 0.25,
      desc: "実測(Shopify Horizon系カート)は0.25s ease-in-out。0.2〜0.35sが自然で、0.5sを超えると次の操作を待たされる。",
    },
    {
      key: "delay",
      label: "delay(押してから畳み始めるまで s)",
      min: 0,
      max: 0.5,
      step: 0.025,
      default: 0.125,
      desc: "この間にゴミ箱の蓋を跳ねさせて「押した」を返す。実測は0.125s。0だと押した手応えが無く、0.3sを超えると反応が遅いと感じる。",
    },
    {
      key: "slide",
      label: "slide(消えながら横へ逃がす距離 px)",
      min: 0,
      max: 80,
      step: 4,
      default: 0,
      desc: "0なら畳むだけ(実測はこれ)。24〜40px横へ逃がすと「捨てた」方向が付く。高さより先に目立つと詰まる動きが見えなくなる。",
    },
    {
      key: "fade",
      label: "fade(透明になり切るまでの割合 %)",
      min: 30,
      max: 100,
      step: 5,
      default: 100,
      desc: "100で高さと同時に消える(実測)。50〜60%にすると文字が先に消えてから畳むので、潰れかけの文字が重なって見えない。",
    },
  ],
  promptTemplate: `リスト(カートの行・TODOなど)の項目の追加と削除をアニメーションさせてください。

- 削除: 押した直後に行を DOM から抜かない。まず行の現在の高さ(clientHeight)を px で測り、CSS変数 --row-height に入れる
- {{delay}}s 待ってから(この間にゴミ箱アイコンの蓋を数px跳ねさせて押下を返す)、{{duration}}s の ease-in-out で height を --row-height → 0 に畳む
- 同時に padding-block・margin-bottom・border-color も 0 / transparent へ。行には overflow: hidden を付ける(中身がはみ出して見えないように)
- opacity は 1→0 を、畳む時間の最初の {{fade}}% で終わらせる(100なら高さと同時)
- 消える行を translateX(-{{slide}}px) へずらす(0なら横には動かさない)
- animationend(または Web Animations API の finished)で初めて DOM から取り除く。これで下の行が畳まれた分だけ滑らかに詰まる
- 追加: 新しい行は height 0・opacity 0 から開始し、同じ {{duration}}s で実際の高さまで開く。height: auto へのアニメーションは interpolate-size: allow-keywords が使えるブラウザならそれで、使えなければ測った px で行う
- 畳んでいる最中の行は pointer-events: none にして二重に押せないようにする
- prefers-reduced-motion 時はアニメーションせず、即座に抜く・即座に挿す`,
  ngExample: {
    say: "「カートの商品を削除したらアニメーションさせて」",
    why: "行をその場でフェードアウトさせて終わりの実装が返りやすい。透明になったあとで行が DOM から抜かれるので、下の行が一瞬でガクッと上へ飛ぶ。何が消えたかは結局見えない。",
  },
  okExample: {
    say: "「削除は行の高さを測って--row-heightに入れ、0.125s待ってから0.25s ease-in-outでheight・padding・marginを0へ畳む。opacityは同時に0。animationendでDOMから外す。追加は0から同じ時間で開く。reduced-motionでは即時」",
    why: "「高さを測って0まで畳む」「終わってから外す」の2点が、下の行が滑らかに詰まるかどうかを決める。待ち時間と時間の数値もあるので、押した手応えと速さが指定どおりに出る。",
  },
  vocab: [
    {
      term: "高さの畳み込み(height collapse)",
      desc: "要素の高さを0まで縮めてから取り除くこと。周りの要素は畳まれた分だけ自然に詰まる。",
    },
    {
      term: "interpolate-size: allow-keywords",
      desc: "height: auto のようなキーワード値へのアニメーションを許すCSSプロパティ。未対応ブラウザでは測ったpx値で代用する。",
    },
    {
      term: "animationend",
      desc: "CSSアニメーションの終了イベント。ここで初めて要素を DOM から外すと、動きの途中で行が消えない。",
    },
    {
      term: "レイアウトシフト",
      desc: "要素の出入りで周りが急に動くこと。高さを畳む・開くことで、急な跳びを連続した動きに変える。",
    },
    {
      term: "FLIP",
      desc: "First・Last・Invert・Play。並べ替えや中間への挿入で、詰まる側の行まで transform で動かしたいときの手法。",
    },
  ],
  related: ["accordion", "swipe-dismiss", "fly-to-cart", "shared-element"],
};
