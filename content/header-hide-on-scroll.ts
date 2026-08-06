import type { MotionEntry } from "@/lib/types";

export const headerHideOnScroll: MotionEntry = {
  slug: "header-hide-on-scroll",
  category: "scroll",
  nameJa: "ヘッダー自動格納",
  nameEn: "hide-on-scroll header / auto-hiding header (headroom)",
  lede: "下に読み進めると固定ヘッダーが上へ引っ込み、少しでも上へ戻すと出てくる挙動。読む面積を稼ぎながらナビへの復帰は1スクロールで済ませられる、長いページの定番。",
  params: [
    {
      key: "offset",
      label: "offset(格納を許す最小スクロール量 px)",
      min: 0,
      max: 300,
      step: 20,
      default: 100,
      desc: "ここまでは何があっても隠さない安全地帯(デモのライムの線)。100px前後が定番。0にすると最上部で一瞬消えて事故に見える。",
    },
    {
      key: "tolerance",
      label: "tolerance(切り替えに要する移動量 px)",
      min: 20,
      max: 300,
      step: 10,
      default: 120,
      desc: "向きが変わってから何px動いたら状態を変えるか。100〜150pxが安定。20px台にすると指の揺れでヘッダーが点滅する。",
    },
    {
      key: "duration",
      label: "duration(出入りの時間 s)",
      min: 0.1,
      max: 1,
      step: 0.05,
      default: 0.35,
      desc: "0.3〜0.4sが自然。0.6sを超えると戻したいのに出てこない感じになる。",
    },
  ],
  promptTemplate: `固定ヘッダーに hide-on-scroll header(auto-hiding header)を実装してください。

- ヘッダーは position: fixed(またはsticky)のまま、transform: translateY(-100%) で画面外へ退避させる
- スクロール方向を検知し、下方向なら格納・上方向なら復帰させる
- スクロール量が {{offset}}px 以下の間は必ず表示したままにする(最上部でのチラつき防止)
- 方向が変わった位置を基準に取り直し、そこから {{tolerance}}px 動いてから状態を切り替える(小さな揺れで点滅させない)
- 出入りは transform の {{duration}}s ease で行い、top や height はアニメーションさせない(リフロー禁止)
- scroll イベントは passive: true で購読し、状態が変わったときだけclassを付け替える
- prefers-reduced-motion 時は遷移時間を0にし、ヘッダーを常時表示のままにする`,
  ngExample: {
    say: "「スクロールしたらヘッダーを隠して」",
    why: "隠す条件も戻す条件も決まらない。スクロールのたびに再計算して点滅する実装や、最上部でも消えてロゴが見えなくなる実装が返ってくる。topをアニメーションさせてカクつくこともある。",
  },
  okExample: {
    say: "「hide-on-scroll headerを実装。方向検知で下スクロール時にtranslateY(-100%)、上で復帰。100px以下は常時表示、方向転換から120px動いてから切り替え、0.35s easeのtransformのみ」",
    why: "「offset」と「tolerance」という2つの閾値を明示したことで、点滅と最上部の消失という定番の2事故を先に潰せている。動かす対象をtransformに限定したのも効いている。",
  },
  vocab: [
    {
      term: "hide on scroll",
      desc: "スクロール方向に応じてヘッダーを出し入れする挙動の英語圏での呼び名。実装ライブラリ headroom.js の名からheadroomとも呼ばれる。",
    },
    {
      term: "tolerance",
      desc: "方向が変わってから状態を切り替えるまでに必要な移動量。これが0だと1pxの揺り戻しで反転して点滅する。",
    },
    {
      term: "offset",
      desc: "格納を許可し始めるスクロール量。ページ最上部でヘッダーが消える事故を防ぐための下駄。",
    },
    {
      term: "スクロール方向検知",
      desc: "前回のscrollTopとの差分で上下を判定する処理。差が0のときは前回の向きを引き継がないと判定が暴れる。",
    },
    {
      term: "passive: true",
      desc: "scrollリスナーに付けるとブラウザがpreventDefaultを待たずにスクロールを進められる。スクロール連動処理では実質必須。",
    },
  ],
  related: ["header-shrink", "header-invert", "scroll-spy"],
};
