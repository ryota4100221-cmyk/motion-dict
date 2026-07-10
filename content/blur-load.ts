import type { MotionEntry } from "@/lib/types";

export const blurLoad: MotionEntry = {
  slug: "blur-load",
  category: "media",
  nameJa: "ブラーアップ",
  nameEn: "blur-up / progressive image loading",
  lede: "ぼけた低解像度画像(LQIP)を先に見せ、本画像の読み込み完了でシャープに切り替える読み込み演出。体感の待ち時間を減らしつつ、アスペクト比の固定でCLS(レイアウトのずれ)を防ぐところまでが本題。",
  params: [
    {
      key: "blur",
      label: "blur(初期ぼかし px)",
      min: 4,
      max: 40,
      step: 2,
      default: 20,
      desc: "16〜24pxが目安。小さいと「ピンボケ画像」にしか見えず、読み込み演出だと伝わらない。",
    },
    {
      key: "duration",
      label: "duration(シャープ化 s)",
      min: 0.2,
      max: 2,
      step: 0.1,
      default: 0.8,
      desc: "0.6〜1sが自然。長すぎると本画像が届いているのに待たせる演出になる。",
    },
  ],
  promptTemplate: `画像の読み込みに blur-up(LQIP)を実装してください。

- 枠に aspect-ratio を固定で指定し、読み込みの前後でレイアウトが動かない(CLS 0)ようにする
- 先に低解像度のプレースホルダ(縮小画像・blurDataURL等)を filter: blur({{blur}}px) + scale(1.06) で表示する
- 本画像の onload を検知したら、{{duration}}s の ease-out で blur(0)・scale(1) に切り替える
- 枠に overflow: hidden を指定し、blurで滲んだ縁を枠の外に隠す(scaleを併用する理由)
- アニメーションさせるのは filter と transform のみ(リフロー禁止)
- prefers-reduced-motion 時はトランジションなしで、読み込み完了と同時に本画像へ即時切り替える`,
  ngExample: {
    say: "「画像をぼかしから読み込む感じにして」",
    why: "読み込み完了の検知(onload)がなく、固定タイマーでぼかしを外すだけの実装が返ってきやすい。回線が遅いとぼけた画像のまま止まり、速いと無意味に待たされる。アスペクト比の固定も抜けてCLSが出る。",
  },
  okExample: {
    say: "「blur-up(LQIP)を実装。aspect-ratio固定でCLS 0、プレースホルダをblur(20px)+scale(1.06)で表示、img.onloadをトリガーに0.8s ease-outでblur(0)/scale(1)へ。overflow:hiddenで縁のにじみを隠す」",
    why: "切替のトリガー(onload)・CLS対策・縁の処理まで指定している。「なぜscaleを併用するか」まで書くと、実装時に勝手に省かれない。",
  },
  vocab: [
    {
      term: "LQIP",
      desc: "Low Quality Image Placeholder。数KBの縮小画像を先に出す手法。Next.jsのblurDataURLはこれの自動生成版。",
    },
    {
      term: "CLS",
      desc: "Cumulative Layout Shift。読み込みで要素がずれる量の指標。枠のaspect-ratio固定(またはwidth/height属性)が最も効く対策。",
    },
    {
      term: "縁のにじみ",
      desc: "filter: blurは要素の縁の外側まで滲む。scale(1.05前後)で一回り大きくし、overflow: hiddenの枠外に追い出して隠す。",
    },
    {
      term: "onload",
      desc: "画像の読み込み完了イベント。blurを外すトリガーは時間ではなくこれ。キャッシュ済みに備えて img.complete も併せて見る。",
    },
  ],
  related: ["crossfade", "blur-reveal", "ken-burns"],
};
