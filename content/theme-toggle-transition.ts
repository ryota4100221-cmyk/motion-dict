import type { MotionEntry } from "@/lib/types";

export const themeToggleTransition: MotionEntry = {
  slug: "theme-toggle-transition",
  category: "ui",
  nameJa: "テーマ切替トランジション",
  nameEn: "theme toggle transition / dark mode transition / view transition theme switch",
  lede: "ライト⇄ダークの切替を一瞬の点滅にせず、新しいテーマの画面を古い画面の上へワイプで塗り広げる演出。View Transitions APIで切替前後の画面をスナップショットし、新しい側のclip-pathだけを動かすので、ページ内の全要素の色遷移を個別に書かなくて済む。",
  params: [
    {
      key: "duration",
      label: "duration(塗り替え時間 s)",
      min: 0.3,
      max: 2,
      step: 0.1,
      default: 1.2,
      desc: "画面全体が動くので短すぎると点滅に見える。0.6〜1.2sが目安。1.5sを超えると切替を待たされる。",
    },
    {
      key: "shape",
      label: "shape(塗り広げる形)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["wipe(横ワイプ)", "circle(ボタンから円)"],
      desc: "wipeは画面の端から一直線に、circleは押したボタンを中心に円で広がる。circleは「押した場所から変わった」因果が伝わる。",
    },
    {
      key: "direction",
      label: "direction(向き)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["テーマで反転", "常に同じ向き"],
      desc: "テーマで反転＝ダークへは左→右、ライトへは右→左。行って戻る関係が見え、2回押しても同じ動きの繰り返しにならない。",
    },
  ],
  promptTemplate: `サイトのライト/ダーク切替ボタンに theme toggle transition(テーマ切替トランジション)を実装してください。

- document.startViewTransition(() => { html の data-theme を切り替える }) で切替前後の画面をスナップショットする
- ::view-transition-old(root) は animation: none で静止させ、::view-transition-new(root) を上(z-index)に重ねる
- 新しい側の clip-path を {{duration}}s で塗り広げる。形は {{shape}}(wipe なら inset(0 100% 0 0) → inset(0)、circle なら押したボタンの中心から circle(0) → 画面の対角線まで)
- 向きは {{direction}}(テーマで反転なら ダークへは左→右、ライトへは右→左 に inset の辺を入れ替える)
- イージングは cubic-bezier(.87, 0, .13, 1) の強い ease-in-out。両端を溜めて中盤で一気に塗る
- 切替中は二重に押されても次の遷移を始めない(フラグで握りつぶし、finished で解除)
- startViewTransition が無いブラウザでは data-theme を即時に切り替えるだけにする
- prefers-reduced-motion 時はトランジションを使わず即時切替にする(画面全体が動く演出なので必ず外す)`,
  ngExample: {
    say: "「ダークモード切替をなめらかにして」",
    why: "「なめらか」だと body に transition: background-color, color を足すだけの実装が返りがち。要素ごとに遷移がずれて文字だけ遅れて変わったり、画像・影・SVGが追従せず、むしろチラついて見える。",
  },
  okExample: {
    say: "「startViewTransitionで切替前後をスナップショット。new(root)のclip-pathを1.2sでinset左→右にワイプ、ライトへ戻すときは右→左。cubic-bezier(.87,0,.13,1)、非対応とreduced-motionは即時切替」",
    why: "色を個別に遷移させるのではなく「画面ごと差し替えて境界だけ動かす」方式と、形・向き・時間・フォールバックまで指定。これで全要素が1本の境界線で同時に塗り替わる。",
  },
  vocab: [
    {
      term: "View Transitions API",
      desc: "DOM更新の前後をブラウザがスクリーンショットし、疑似要素として重ねて補間する仕組み。document.startViewTransition(更新関数) で起動する。",
    },
    {
      term: "::view-transition-old / -new",
      desc: "切替前・切替後のスナップショット。old を止めて new の clip-path だけ動かすと、新しい画面が古い画面を塗りつぶすように見える。",
    },
    {
      term: "clip-path: inset()",
      desc: "上右下左の内側を切り取る。inset(0 100% 0 0) は右端から100%削った＝幅0。0 に戻すと左から露出する。",
    },
    {
      term: "data-theme",
      desc: "html要素に付けるテーマ識別属性。CSS変数を [data-theme=\"dark\"] で丸ごと差し替えるので、切替はこの1属性の書き換えで済む。",
    },
    {
      term: "FOUC / チラつき",
      desc: "要素ごとに色遷移の速度や対象がずれ、一瞬だけ混ざった配色が見える現象。スナップショット方式なら起きない。",
    },
  ],
  related: ["circle-reveal", "curtain-wipe", "toggle-switch", "section-color-swap"],
};
