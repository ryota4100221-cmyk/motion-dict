import type { MotionEntry } from "@/lib/types";

export const duotoneHover: MotionEntry = {
  slug: "duotone-hover",
  category: "media",
  nameJa: "デュオトーンホバー",
  nameEn: "duotone hover / color overlay hover",
  lede: "モノクロ+単色オーバーレイのデュオトーン画像が、ホバーでフルカラーに切り替わる演出。チームメンバーやワークス一覧の定番で、色数を絞ることで写真の色味がバラバラでも一覧に統一感が出て、触れた1枚だけが生きて見える。",
  params: [
    {
      key: "strength",
      label: "strength(オーバーレイopacity)",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.75,
      desc: "0.6〜0.85が定番。0だとただの白黒写真、1.0に近いと黒く潰れて被写体が分からなくなる。",
    },
    {
      key: "duration",
      label: "duration(切り替え時間 s)",
      min: 0.15,
      max: 1.2,
      step: 0.05,
      default: 0.45,
      desc: "0.3〜0.6sが自然。色は面積が大きく変わるので、下線などよりやや遅めが落ち着く。",
    },
  ],
  promptTemplate: `画像一覧に duotone hover を実装してください。

- img に filter: grayscale(1) を掛けてモノクロにする
- img の上に position: absolute のカラーレイヤーを重ね、background にブランドカラー、mix-blend-mode: multiply、opacity: {{strength}} を指定する
- ホバーでカラーレイヤーを opacity: 0、img を grayscale(0) に、{{duration}}s の ease-out で同時に切り替える
- カラーレイヤーには pointer-events: none を付け、下のリンクのクリックを妨げない
- :hover 判定はカード全体に付け、名前やテキストに乗っても画像が反応するようにする
- 動かすのは filter と opacity のみ(リフロー禁止)
- prefers-reduced-motion 時は transition を 0s にして即時に切り替える`,
  ngExample: {
    say: "「メンバー写真を白黒にして、ホバーでカラーにして」",
    why: "grayscaleの単純切り替えだけが返ってきて「デュオトーン(単色の色被せ)」にならない。ブランドカラーの層がないと一覧の統一感が出ず、ただの白黒写真集になる。",
  },
  okExample: {
    say: "「duotone hoverを実装。grayscale(1)のimgにブランドカラーのレイヤーをmultiply・opacity 0.75で重ね、ホバーで両方を0.45s ease-outで解除。レイヤーはpointer-events:none、判定はカード全体」",
    why: "二層構造(モノクロ+色被せ)・ブレンドモード・数値・クリック透過まで指定。「両方を同時に解除」と書くことでモノクロだけ残る中途半端な実装を防げる。",
  },
  vocab: [
    {
      term: "デュオトーン",
      desc: "黒+単色の2色で構成された写真表現。Spotifyのキャンペーンで広まり、写真の質がバラバラでもトーンを揃えられる。",
    },
    {
      term: "mix-blend-mode: multiply",
      desc: "重ねた色を掛け合わせる合成。モノクロ写真の上に単色を置くと影がその色に染まり、デュオトーンになる。",
    },
    {
      term: "filter: grayscale",
      desc: "彩度を落としてモノクロ化するフィルタ。0〜1で段階指定でき、transitionで滑らかにアニメーションできる。",
    },
    {
      term: "pointer-events: none",
      desc: "要素をクリック判定から除外する指定。装飾レイヤーに必ず付け、下のリンクやボタンを妨げない。",
    },
  ],
  related: ["image-zoom-hover", "ken-burns", "spotlight-hover"],
};
