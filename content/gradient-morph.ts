import type { MotionEntry } from "@/lib/types";

export const gradientMorph: MotionEntry = {
  slug: "gradient-morph",
  category: "transition",
  nameJa: "グラデーションモーフ",
  nameEn: "gradient morph / animated gradient background",
  lede: "背景のグラデーションが、中心・広がり・色を一度に補間しながら次の状態へ溶けていく演出。色だけを差し替えるセクションカラー遷移と違い、光源そのものが移動して広がるので、章が変わったのではなく「場の空気が変わった」ように見える。",
  params: [
    {
      key: "duration",
      label: "duration(遷移時間 s)",
      min: 0.3,
      max: 3,
      step: 0.1,
      default: 1.8,
      desc: "1.5〜2sが背景として自然。0.5s以下だと前景の動きと競合して目が引かれ、3sでは次の状態に色が追いつかない。",
    },
    {
      key: "spread",
      label: "spread(広がり %)",
      min: 50,
      max: 150,
      step: 5,
      default: 100,
      desc: "グラデーションの半径倍率。100%前後だと色の境目が画面外に逃げて滑らか。60%以下は輪郭が見えてスポットライトになる。",
    },
    {
      key: "easing",
      label: "easing(補間カーブ)",
      min: 0,
      max: 2,
      step: 1,
      default: 2,
      options: ["linear", "ease-out", "ease-in-out"],
      desc: "背景はease-in-outが定番。始点と終点が静かなので、動いていることに気づかせずに変えられる。",
    },
  ],
  promptTemplate: `背景のグラデーションが状態ごとに滑らかに変わる gradient morph を実装してください。

- グラデーションの中心・半径・各色・各カラーストップを、すべてCSSカスタムプロパティに逃がす
  (--gm-x / --gm-y / --gm-size-x / --gm-size-y / --gm-c1 / --gm-c2 / --gm-c3 / --gm-s1 / --gm-s2)
- それらを @property で型付き登録する(<percentage> と <color>)。
  登録しないとCSSは値を「ただの文字列」として扱い、補間されずにパッと切り替わってしまう。ここが実装の要
- background-image: radial-gradient(var(--gm-size-x) var(--gm-size-y) at var(--gm-x) var(--gm-y), ...) を1枚のレイヤーに置く
- 半径は基準値に {{spread}}% を掛けた値にする
- 状態が変わったらJSはカスタムプロパティを書き換えるだけにし、
  transition: --gm-x, --gm-y, ... {{duration}}s {{easing}} で補間はCSSに任せる
  (JSで毎フレームRGBを補間したり、background-imageの文字列を組み直したりしない)
- 背景レイヤーは position: fixed / inset: 0 / z-index: -1 に置き、前景のスクロールと切り離す
- 状態の切り替えはIntersectionObserverでセクションの進入を検知する。scrollイベントでの位置計算はしない
- 明るい状態と暗い状態をまたぐなら前景の文字色も同時に切り替え、コントラスト比4.5:1以上を保つ
- prefers-reduced-motion 時は transition を 0s にして即時切替にする(背景の色が変わること自体は残す)`,
  ngExample: {
    say: "「背景のグラデーションがふわっと変わるようにして」",
    why: "カスタムプロパティを@propertyで登録していない実装が返ってきて、transitionを書いたのに背景がパッと切り替わる。あるいはbackground-imageをJSで毎フレーム文字列生成する重い実装や、グラデーションを2枚重ねてopacityでクロスフェードするだけ(=光源が動かない)の実装になる。",
  },
  okExample: {
    say: "「gradient morphを実装。中心・半径・3色・2ストップを@propertyで<percentage>/<color>登録し、transition 1.8s ease-in-outで補間。切替はIntersectionObserverでJSは変数を書き換えるだけ。reduced-motionでは0s」",
    why: "「@propertyで型付き登録する」の一言が成否を分ける。そのうえで補間をCSSに預ける方針と切替トリガーまで指定しているので、重い実装にもパキッと切り替わる実装にもならない。",
  },
  vocab: [
    {
      term: "@property",
      desc: "カスタムプロパティに型(syntax)・初期値・継承の有無を宣言する規則。型が付いて初めてCSSはその値を補間でき、グラデーションや角度がアニメーションするようになる。",
    },
    {
      term: "登録済みカスタムプロパティ(registered custom property)",
      desc: "@propertyで型付けされた変数。未登録の変数は常に文字列扱いで、transitionを書いても中間の値が作られない。",
    },
    {
      term: "カラーストップ",
      desc: "グラデーション内で色が置かれる位置(%)。色だけでなくストップも動かすと、色の帯そのものが伸び縮みして「にじむ」印象になる。",
    },
    {
      term: "radial-gradient の明示半径",
      desc: "radial-gradient(80% 60% at 30% 20%, ...) の「80% 60%」。楕円の半径を明示すると広がりをパラメータとして動かせる。",
    },
    {
      term: "アンビエント背景",
      desc: "内容を持たず空気だけを担う背景レイヤー。前景と競合しないよう、動きは遅く・コントラストは低くが原則。",
    },
  ],
  related: ["section-color-swap", "gradient-border", "god-rays"],
};
