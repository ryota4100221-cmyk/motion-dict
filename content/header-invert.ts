import type { MotionEntry } from "@/lib/types";

export const headerInvert: MotionEntry = {
  slug: "header-invert",
  category: "scroll",
  nameJa: "ヘッダー色反転",
  nameEn: "header color invert / adaptive header theme",
  lede: "固定ヘッダーが、下を通るセクションの明暗に合わせて自分の文字色と背景色を反転させる処理。黒いセクションや写真の上でロゴが消える事故を、色の出し分けではなく「暗いかどうか」の目印ひとつで防げる。",
  params: [
    {
      key: "probe",
      label: "probe(判定ラインの位置 px)",
      min: 0,
      max: 56,
      step: 4,
      default: 28,
      desc: "画面上端から何px下で明暗を判定するか。ヘッダー高さの半分あたりが定番。0にすると境界でチラつく。",
    },
    {
      key: "duration",
      label: "duration(反転の遷移時間 s)",
      min: 0.1,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "0.4〜0.6sが自然。速すぎるとパッと切り替わって安っぽく、1sを超えると境界で色が定まらない。",
    },
    {
      key: "mode",
      label: "mode(実装方式)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["class-swap", "blend-difference"],
      desc: "class-swapはJSで判定して変数を差し替える方式。blend-differenceは合成モード任せで、判定コードが丸ごと要らない。",
    },
  ],
  promptTemplate: `固定ヘッダーに header color invert(背景の明暗に追従する色反転)を実装してください。

- 暗い背景のセクション側に data-dark 属性を付けて目印にする(どのセクションが何色かをJSの配列に持たせない)
- スクロールとリサイズのたびに、ビューポート上端から {{probe}}px 下を走る判定ラインと交差している data-dark セクションを getBoundingClientRect で探す(rect.top <= probe && rect.bottom >= probe)
- 交差していればヘッダーを反転状態にする。色は --header-fg / --header-bg のCSS変数1組にまとめ、クラス(またはdata-theme属性)の切り替えだけで差し替える
- 遷移は {{duration}}s の ease で color と background-color を同時に動かす
- 実装方式は {{mode}} を使う。blend-difference の場合はヘッダーを背景透過＋color: #fff＋mix-blend-mode: difference にして判定コードを省く(代わりにロゴ画像やボタンの色は個別に制御できなくなる)
- scroll は passive: true で登録し、計測は requestAnimationFrame で1フレーム1回に間引く
- prefers-reduced-motion 時はトランジションなしで色だけ即座に切り替える(反転自体は可読性のため必ず残す)`,
  ngExample: {
    say: "「スクロールしたらヘッダーの色を白から黒に変えて」",
    why: "「どこで」変えるかが決まっていない。セクションごとの色をJSの配列にベタ書きしてセクションを1つ足すたびに壊れる実装や、scrollYの固定px値で切り替えてレスポンシブで即ズレる実装が返ってくる。",
  },
  okExample: {
    say: "「header color invertを実装。暗いセクションにdata-darkを付け、上端28pxの判定ラインとrectの交差で反転。色は--header-fg/--header-bgの2変数に集約して0.6s easeでtransition。scrollはpassive+rAFで間引く」",
    why: "目印をDOM側(data-dark)に置き、判定をスクロール量ではなく矩形の交差で行う、と決めている。この2点だけでセクションの増減や高さ変更に壊れない実装になる。",
  },
  vocab: [
    {
      term: "data-dark(目印属性)",
      desc: "色そのものではなく「暗いかどうか」だけをDOMに持たせる考え方。実際の色はCSS側に集約でき、セクションが増えてもJSを触らずに済む。",
    },
    {
      term: "判定ライン(probe line)",
      desc: "ビューポート上端から一定px下に引く仮想の走査線。この線を跨いだかで判定するため、ヘッダーが縮んでもスクロール量が変わっても位置がズレない。",
    },
    {
      term: "mix-blend-mode: difference",
      desc: "背景色との差分で描画する合成モード。白い文字を置くだけで明暗が自動反転するが、写真の上では色が濁り、ロゴ画像やボタンの色は個別に制御できない。",
    },
    {
      term: "--header-fg / --header-bg",
      desc: "ヘッダー内の全要素を同じ2変数に参照させておく設計。反転が「変数2つの差し替え」で済み、要素ごとの色指定が散らばらない。",
    },
  ],
  related: ["header-shrink", "section-color-swap", "custom-cursor"],
};
