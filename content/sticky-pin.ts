import type { MotionEntry } from "@/lib/types";

export const stickyPin: MotionEntry = {
  slug: "sticky-pin",
  category: "scroll",
  nameJa: "スティッキーピン",
  nameEn: "sticky pin / pinned section",
  lede: "スクロール中に要素が画面に固定され、残りのコンテンツだけが流れていく演出。position: stickyだけで成立する最も堅牢なピン留めで、ストーリーテリングや工程紹介の骨格になる。",
  params: [
    {
      key: "length",
      label: "length(固定区間の長さ 画面高比)",
      min: 1.5,
      max: 4,
      step: 0.5,
      default: 2,
      desc: "親セクションの高さを画面高さの何倍にするか。2〜3倍が定番。4倍を超えると読者が飽きて離脱する。",
    },
    {
      key: "top",
      label: "top(固定位置 px)",
      min: 0,
      max: 80,
      step: 8,
      default: 16,
      desc: "画面上端から何pxの位置で固定するか。固定ヘッダーがある場合はその高さ分を確保する。",
    },
  ],
  promptTemplate: `スクロール中に要素が画面に固定される sticky pin を実装してください。

- JSでfixedを付け外しするのではなく、position: sticky; top: {{top}}px で実装する
- 固定したい要素を高さのある親セクション(画面高さの {{length}} 倍)で包む。stickyが効くのはこの親の範囲内だけで、「親の高さ − 固定要素の高さ」が実質の固定区間になる
- 祖先のどこかに overflow: hidden / auto / scroll があると sticky は無効になる。はみ出し対策が必要な祖先には overflow: clip を使う
- 固定中の進捗演出(バー・数値など)を足す場合、進捗は「セクション内で消化したスクロール量 ÷ 固定区間」を0〜1にclampして求め、書き込みは requestAnimationFrame 側で transform のみ動かす(リフロー禁止)
- prefers-reduced-motion 時は進捗連動の演出を止めて静的表示にする(stickyの固定自体はアニメーションではないので残してよい)`,
  ngExample: {
    say: "「スクロールしたらこのブロックを画面に固定して」",
    why: "scrollイベントを監視してposition: fixedをJSで付け外しする壊れやすい実装が返ってきがち。ガタつき・iOSでのズレ・解除位置のバグの温床になるうえ、固定区間の長さも決まらない。",
  },
  okExample: {
    say: "「position: sticky; top: 16pxでピン留め。親セクションを200vhにして固定区間を確保。祖先にoverflow: hiddenを置かない(必要ならclip)。進捗バーはrAFでtransformのみ」",
    why: "実装方式(sticky)・固定区間の作り方(親の高さ)・stickyを殺す罠の回避まで指定している。「overflow: clip」の一言が「なぜか固定されない」事故を防ぐ。",
  },
  vocab: [
    {
      term: "position: sticky",
      desc: "スクロールに応じてrelativeとfixedを自動で行き来する配置。JS不要でピン留めできるが、効く範囲は親要素の中だけ。",
    },
    {
      term: "overflow: clip",
      desc: "はみ出しを描画だけ断つ指定。overflow: hiddenは祖先にあるだけでstickyを殺すが、clipはスクロールコンテナ化しないので殺さない。",
    },
    {
      term: "固定区間(pin distance)",
      desc: "要素が固定されたまま消化されるスクロール量。「親の高さ − 固定要素の高さ」で決まり、親を高くするほど長く止まる。",
    },
    {
      term: "top(しきい値)",
      desc: "stickyが発動する画面上端からの距離。top: 0で上端ピタ付き、固定ヘッダーの高さ分ずらすのが実務の定番。",
    },
  ],
  related: ["horizontal-scroll", "scroll-progress", "parallax"],
};
