import type { MotionEntry } from "@/lib/types";

export const multiplayerCursors: MotionEntry = {
  slug: "multiplayer-cursors",
  category: "ui",
  nameJa: "マルチプレイヤーカーソル（名札付きのカーソルが漂い、吹き出しで話す）",
  nameEn: "multiplayer cursors / live cursors / collaborator cursors / cursor chat",
  lede: "名札を付けた他人のカーソルが画面の上でわずかに漂い、ときどき道具を持ち替え、吹き出しで一言しゃべる。Figma 以来の「いま誰かがここにいる」を見せる共同編集の作法で、ランディングページでは本物の接続が無くても「一緒に作る」空気を出す飾りとして使われる。肝は止まって見えないほど小さな漂い(10px以内・5秒周期)と、吹き出しを「出る→読ませる→上へ抜けて消える」1回きりで入れ替えることで、大きく動かすとただの邪魔なマスコットになる。",
  params: [
    {
      key: "drift",
      label: "drift(漂う幅 px)",
      min: 0,
      max: 30,
      step: 1,
      default: 9,
      desc: "カーソルの束が漂う最大の振れ幅。観察元は右に7px・上に9px。6〜12pxで「手を置いたまま考えている人」に見え、20pxを超えると何かを指し示しているように見えて文字を読む目を奪う。",
    },
    {
      key: "driftDuration",
      label: "driftDuration(漂う周期 s)",
      min: 1.5,
      max: 12,
      step: 0.1,
      default: 5,
      desc: "漂いの1周の時間。観察元は5s ease-in-out。4〜7sが人の手の揺れに近く、2sを切るとそわそわして見える。",
    },
    {
      key: "interval",
      label: "interval(発言を入れ替える間隔 s)",
      min: 2,
      max: 8,
      step: 0.1,
      default: 4.2,
      desc: "1人のカーソルが次の発言・道具に替わるまでの時間で、吹き出し1回の長さも同じ。観察元は4.2s。短い一言なら3.5〜5sで読み切れる。2人目は半周期ずらして交互に話させる。",
    },
    {
      key: "pop",
      label: "pop(道具を持ち替える時間 s)",
      min: 0.1,
      max: 1.2,
      step: 0.05,
      default: 0.45,
      desc: "道具の絵が scale(0.5)・-20°から元の大きさへ戻る時間。観察元は0.45s。0.3〜0.5sで「持ち替えた」と分かり、0.8sを超えると絵がもたついて見える。",
    },
  ],
  promptTemplate: `共同編集者のカーソルを見せる multiplayer cursors(名札付きのカーソルと吹き出し)を実装してください。

- きっかけ: 操作は要らない。表示されたら2人分のカーソルが自動で漂い、{{interval}}s ごとに発言と道具を入れ替える(2人目は {{interval}}s の半分だけずらして交互に話す)。カーソルのある面をクリック(タッチはタップ)すると、待たずに次の発言へ進め、そこから間隔を数え直す
- カーソル1本は「道具の絵(20×20 の SVG・矢印/ペン/コメント/テキストの4種)」「名札(名前の小さなラベル・背景色はその人の色)」「吹き出し(名札の左上 left: 14px・bottom: calc(100% + 4px) に position: absolute)」を1つの束にし、面の上の決まった位置に position: absolute で置く
- 漂い: 束ごとに @keyframes で transform: translate を 0%/100% (0,0) → 30% ({{drift}}px×7/9, −{{drift}}px×5/9) → 65% ({{drift}}px×2/9, −{{drift}}px) と回し、{{driftDuration}}s ease-in-out infinite で再生する。2人目は animation-delay を負の値にして位相をずらす
- 吹き出し: 発言が替わるたびに要素を作り直し(React なら key に発言の番号を入れる)、{{interval}}s ease-in-out で1回だけ再生する。0〜8% は opacity 0・translateY(6px) scale(0.9)、18〜84% は opacity 1・transform none、96〜100% は opacity 0・translateY(-4px)。transform-origin は左下(0 100%)
- 道具の持ち替え: 発言と同時に道具の絵も作り直し、opacity 0・scale(0.5) rotate(-20deg) → opacity 1・none を {{pop}}s cubic-bezier(0.22, 1, 0.36, 1) で再生する。transform-origin は矢印の先端(3px 3px)
- 発言の切り替えは setInterval(または requestAnimationFrame の経過時間)で {{interval}}s の半分ごとに番を進め、偶数番/奇数番で2人に振り分ける
- 動かすのは transform と opacity だけ(left・top を毎フレーム書き換えない)。カーソル・名札・吹き出しは装飾なので aria-hidden にし、pointer-events を面の側で受ける
- prefers-reduced-motion 時は漂いと持ち替えのアニメーションを止め、吹き出しは最初の発言を opacity 1 のまま出しっぱなしにして入れ替えない`,
  ngExample: {
    say: "「Figmaみたいに他の人のカーソルが動いてる感じを出して」",
    why: "画面の端から端へカーソルが滑っていく実装や、ランダムな座標へ毎秒ワープする実装が返ってきやすい。大きく動くカーソルは読み手の目を奪うだけで「そこに人がいる」感じにはならない。吹き出しの出し方も決まらないので、フェードの切り替えだけで文字が入れ替わり、いつ話したのかが伝わらない。",
  },
  okExample: {
    say: "「名札付きカーソル2本を置き、束ごとtranslateで最大9pxだけ5s ease-in-outで漂わせる。4.2sごとに吹き出しと道具を作り直し、吹き出しは0〜8%非表示→18〜84%表示→96%で上へ抜けて消える1回再生、道具はscale(0.5) rotate(-20deg)から0.45sで戻す。2人目は半周期ずらす。reduced-motionでは静止」",
    why: "「その場で小さく漂う」と「発言ごとに1回きりの出入り」を数値で分けて書いているので、ワープも常時点滅も起きない。2人目を半周期ずらす指定で、2人が同時にしゃべって画面が騒がしくなるのを防げる。",
  },
  vocab: [
    {
      term: "マルチプレイヤーカーソル(multiplayer cursors)",
      desc: "共同編集で他の参加者のポインタ位置を名札付きで表示するもの。Figma・Miro・Liveblocks などの呼び名で、live cursors とも言う。",
    },
    {
      term: "プレゼンス(presence)",
      desc: "「いま誰がここにいるか」を伝える表示の総称。カーソルのほか、右上に並ぶ参加者のアバターや、選択中の枠の色もプレゼンスに含まれる。",
    },
    {
      term: "カーソルチャット(cursor chat)",
      desc: "カーソルの横に吹き出しを出して一言しゃべる機能。Figma ではスラッシュキーで呼び出す。この項目の吹き出しはその見た目を借りた演出。",
    },
    {
      term: "アイドルドリフト(idle drift)",
      desc: "止まっていると死んで見える要素を、数px・数秒周期で漂わせて「生きている」ことを示す揺れ。ambient float と同じ考え方を小さく使う。",
    },
    {
      term: "key による再マウント",
      desc: "React で key を変えると要素が作り直され、CSS アニメーションが頭から再生される。吹き出し・道具を1回ずつ再生し直すのに使う。兄弟の key は line-/tool- のように接頭辞で分ける。",
    },
  ],
  titleAct: { act: "ambient-float", map: { distance: "drift*2", duration: "driftDuration" } },
  aliases: ["ふわふわカーソル", "ぴょこっ", "共同編集", "Figmaのカーソル", "名札カーソル"],
  related: ["custom-cursor", "ambient-float", "chat-sequence", "tooltip-pop"],
};
