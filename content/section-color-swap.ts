import type { MotionEntry } from "@/lib/types";

export const sectionColorSwap: MotionEntry = {
  slug: "section-color-swap",
  category: "scroll",
  nameJa: "セクションカラー遷移",
  nameEn: "section color swap / background color transition on scroll",
  lede: "スクロールでセクションに差しかかると、ページ全体の背景色がなめらかに切り替わる演出。1ページの中でセクションごとに世界観を切り替えられ、章立ての体感が生まれる。実装はCSS変数の書き換えとtransitionだけで軽い。",
  params: [
    {
      key: "duration",
      label: "duration(遷移時間 s)",
      min: 0.2,
      max: 2,
      step: 0.1,
      default: 0.8,
      desc: "0.6〜1sがなめらか。0.3s以下はパキッと切り替わり、1.5sを超えると次のセクションに色が追いつかない。",
    },
    {
      key: "trigger",
      label: "trigger(切替タイミング)",
      min: 0.1,
      max: 0.9,
      step: 0.1,
      default: 0.4,
      desc: "次セクションがビューポートにどれだけ入ったら切り替えるか(IntersectionObserverのthreshold)。0.3〜0.5が自然。",
    },
  ],
  promptTemplate: `スクロール位置に応じてページ背景色が切り替わる section color swap を実装してください。

- 背景色はbody(またはページのラッパー)1枚だけで管理し、CSS変数 --bg を background-color に割り当てる
- 各セクションに data-bg 属性で色を持たせ、IntersectionObserver(threshold: {{trigger}})でセクションの進入を検知したら --bg を書き換える
- 色の補間は transition: background-color {{duration}}s ease に任せる(JSで毎フレームRGBを補間しない)
- scrollイベントでの位置計算はしない。進入検知はIntersectionObserverに任せる
- 背景が暗色に変わるセクションでは文字色も同時に切り替え、コントラスト比4.5:1以上を保つ
- prefers-reduced-motion 時は transition を 0s にして即時切替にする(色の切り替え自体は残す)`,
  ngExample: {
    say: "「スクロールで背景の色が変わるようにして」",
    why: "scrollイベントで毎フレーム位置計算して色をJSで補間する重い実装や、セクションごとに背景を塗り分けただけで境目がぶつ切りになる実装が返ってくる。切替タイミングも遷移時間も決まらない。",
  },
  okExample: {
    say: "「section color swapを実装。背景はbody1枚+CSS変数--bg、各セクションのdata-bgをIntersectionObserver(threshold 0.4)で検知して書き換え、transition 0.8s ease。文字色も同時に切り替えてコントラスト維持」",
    why: "検知方法(IO)・状態の持ち方(CSS変数1枚)・数値まで指定している。「body1枚で管理」の一言で、境目がぶつ切りになる塗り分け実装を防げる。",
  },
  vocab: [
    {
      term: "IntersectionObserver",
      desc: "要素のビューポート進入を非同期で検知するAPI。scrollイベントの毎フレーム計算より軽く、この演出の標準装備。",
    },
    {
      term: "threshold",
      desc: "要素が何割見えたら発火するかの設定。切替タイミングの調整はここで行う。",
    },
    {
      term: "CSS変数(カスタムプロパティ)",
      desc: "--bgのようにJSから1箇所書き換えれば全体に波及する値。JSの状態をCSSへ橋渡しする配線になる。",
    },
    {
      term: "transition: background-color",
      desc: "色の補間はブラウザに任せる指定。JSで毎フレームRGBを計算する必要はなく、ページ全体1枚なら負荷も軽い。",
    },
  ],
  related: ["scroll-fade-in", "sticky-pin", "scroll-progress"],
};
