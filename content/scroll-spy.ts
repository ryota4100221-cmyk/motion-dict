import type { MotionEntry } from "@/lib/types";

export const scrollSpy: MotionEntry = {
  slug: "scroll-spy",
  category: "scroll",
  nameJa: "スクロールスパイ",
  nameEn: "scroll spy / active section highlight",
  lede: "スクロール位置に応じて目次・ナビの「現在地」がハイライトされる案内演出。長いページで読者が迷子にならなくなり、ドキュメント・LP・採用サイトの回遊を支える裏方の定番。",
  params: [
    {
      key: "line",
      label: "line(判定ラインの位置 %)",
      min: 10,
      max: 70,
      step: 5,
      default: 35,
      desc: "画面上端から何%を現在地の判定ラインにするか(デモのライムの破線)。30〜40%が読み心地に合う。50%を超えると切り替わりが遅れて感じる。",
    },
    {
      key: "duration",
      label: "duration(インジケーター移動 s)",
      min: 0,
      max: 0.6,
      step: 0.05,
      default: 0.25,
      desc: "現在地マーカーがスライドする時間。0.2〜0.3sが機敏。0.5sを超えるとスクロールに置いていかれる。",
    },
  ],
  promptTemplate: `目次ナビの現在地がスクロールに追従してハイライトされる scroll spy を実装してください。

- scrollイベントで全セクションのgetBoundingClientRectを毎回読むのではなく、IntersectionObserver で検知する
- 「画面に見えているか」で判定しない。rootMargin の上を -{{line}}%、下を -(99 − {{line}})% 削り、画面上端から {{line}}% の位置に細い判定帯を作って「帯に触れたセクション」だけをアクティブにする(境界で2つ同時に光る事故を防ぐ)
- 同フレームで複数セクションが交差した場合は最後に入ったものを採用し、アクティブは常に1つに保つ
- ハイライトは色替えだけでなく、インジケーター(バー・ドット)を transform: translateY で {{duration}}s かけてスライドさせる(top/leftではなくtransformで動かす)
- ナビクリックのジャンプ時も判定はIOに任せ、フラグでの手動制御はしない。着地位置は scroll-margin-top で固定ヘッダー分を確保する
- prefers-reduced-motion 時はインジケーターのスライドを止め、切り替えを即時反映にする`,
  ngExample: {
    say: "「スクロールしたらメニューの現在地を光らせて」",
    why: "scrollイベント+offsetTop総当たりの重い実装や、threshold: 0のIntersectionObserverで「見えたら即アクティブ」にする実装が返ってきがち。後者はセクションの境界で2つ同時に光り、現在地として信用できなくなる。",
  },
  okExample: {
    say: "「scroll spyをIntersectionObserverで。rootMarginで画面上から35%に細い判定帯を作り、帯に触れたセクションだけアクティブ。インジケーターはtranslateYで0.25s、アクティブは常に1つ」",
    why: "判定方式(細い帯)まで指定しているので「2つ同時に光る」事故が起きない。判定ラインの高さ・移動時間が数値で決まっており、そのまま実装に落ちる。",
  },
  vocab: [
    {
      term: "IntersectionObserver",
      desc: "要素とビューポート(root)の交差を非同期で監視するAPI。scrollイベントで毎フレーム位置を計算するより圧倒的に軽い。",
    },
    {
      term: "rootMargin",
      desc: "判定領域を広げたり削ったりするマージン。負の%で上下を削り込むと「画面のこの一線に触れたら」という判定帯が作れる。",
    },
    {
      term: "判定ライン(activation line)",
      desc: "現在地を決める基準線。「見えているか」ではなく「この線を跨いだか」で判定すると、アクティブが常に1つに定まる。",
    },
    {
      term: "scroll-margin-top",
      desc: "アンカージャンプの着地位置を調整するCSS。固定ヘッダーの高さ分を確保しないと、見出しがヘッダーに隠れて判定もズレる。",
    },
  ],
  related: ["scroll-progress", "tab-indicator", "section-color-swap"],
};
