import type { MotionEntry } from "@/lib/types";

export const letterSpacingHover: MotionEntry = {
  slug: "letter-spacing-hover",
  category: "hover",
  nameJa: "字間ひらきホバー",
  nameEn: "letter-spacing hover / tracking expand on hover",
  lede: "ホバーでリンクの字間だけがゆっくり開いていく、線も色も足さない最小のリンク演出。開いた分だけ文字列が伸びて周りを押すので、負のマージンで幅を打ち消せるかどうかが実装の成否を分ける。",
  params: [
    {
      key: "spacing",
      label: "spacing(開く字間 em)",
      min: 0.05,
      max: 0.5,
      step: 0.01,
      default: 0.2,
      desc: "0.15〜0.25emが上品。0.4emを超えると単語が読み取れず、ただ散らばって見える。",
    },
    {
      key: "duration",
      label: "duration(開ききる時間 s)",
      min: 0.2,
      max: 2,
      step: 0.1,
      default: 1.4,
      desc: "1.2〜1.5sと長めが効く。0.3s程度だと字間が動いたことに気づかれず、ただのチラつきになる。",
    },
    {
      key: "ease",
      label: "ease(開くカーブ)",
      min: 0,
      max: 2,
      step: 1,
      default: 1,
      options: ["linear", "expo-out", "ease-in-out"],
      desc: "expo-out(序盤に一気に開き、残りをゆっくり詰める)が定番。長いdurationでも待たされない。",
    },
    {
      key: "compensate",
      label: "compensate(幅の打ち消し)",
      min: 0,
      max: 2,
      step: 1,
      default: 2,
      desc: "none=隣を押しのける。trailing=末尾の余白だけ消す最低限。full=両側で打ち消して外形が1pxも動かない。",
      options: ["none", "trailing", "full"],
    },
  ],
  promptTemplate: `ナビゲーションのリンクに letter-spacing hover を実装してください。

- 通常時は letter-spacing: normal、ホバー時に {{spacing}}em まで開く
- transition は letter-spacing に {{duration}}s / {{ease}} を指定し、leave では同じ時間で戻す
- letter-spacing は「最後の1文字の後ろにも」余白を足すので、素のままだとリンクの幅が 文字数×{{spacing}}em 増えて隣のリンクを押す
- 幅の打ち消しは {{compensate}} 方式で行う
  - trailing: margin-inline-end: -{{spacing}}em で末尾の余白だけ消す(見た目の右端が揃う)
  - full: margin-inline: calc(文字数 * -{{spacing}}em / 2) を左右に入れ、外形の幅を一定に保つ
- 文字数はJSで textContent.length から出してCSS変数に渡す(決め打ちの固定値を書かない)
- 色や下線は変えない。この演出は字間だけで成立させる
- white-space: nowrap を付け、開いた途中で折り返さないようにする
- prefers-reduced-motion 時は transition を切り、ホバーでも字間を変えずに opacity か色でフォーカスを示す
- タッチデバイスでは hover が効かないので、タップで開いた状態をトグルできるようにする`,
  ngExample: {
    say: "「リンクのホバーで文字の間隔を広げて」",
    why: "letter-spacing を足すだけの実装が返ってきて、ホバーのたびに隣のリンクが右へずれるナビになる。打ち消しの指定が無いと、この横ズレはまず直らない。",
  },
  okExample: {
    say: "「ナビのリンクにletter-spacing hoverを実装。normal→0.2em、1.4sのexpo-out、leaveも同じ。文字数×0.2emの半分を左右に負のmargin-inlineで入れて外形の幅を固定。文字数はJSでCSS変数に渡す。色と下線は変えない。reduced-motion時は字間を動かさず色で示す」",
    why: "開く量・時間・カーブに加えて「幅を固定する」という要件と、その具体的な打ち消し方まで指定している。この一言があるかどうかでナビが揺れるか揺れないかが決まる。",
  },
  vocab: [
    {
      term: "letter-spacing",
      desc: "文字と文字の間に足す余白。日本語では字間・英語ではトラッキングと呼ばれる。最後の1文字の後ろにも足される点が実装上の罠。",
    },
    {
      term: "trailing space(末尾の余白)",
      desc: "letter-spacing が最後の文字の後ろに残す余白。margin-inline-end に同じ値の負数を入れて打ち消すのが定石。",
    },
    {
      term: "リフロー",
      desc: "幅や高さが変わってレイアウトを計算し直すこと。letter-spacing はこれが走るので、隣の要素まで動く。transform と違って避けられない。",
    },
    {
      term: "トラッキングとカーニング",
      desc: "トラッキングは文字列全体の字間を一律に、カーニングは特定の2文字の詰めを個別に調整する。ここで動かすのはトラッキング。",
    },
  ],
  related: ["tracking-in", "underline-reveal", "text-slide-swap"],
};
