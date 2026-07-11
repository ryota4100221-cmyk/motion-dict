import type { MotionEntry } from "@/lib/types";

export const logoMarquee: MotionEntry = {
  slug: "logo-marquee",
  category: "media",
  nameJa: "ロゴマーキー",
  nameEn: "logo marquee / logo wall",
  lede: "クライアントロゴが横に流れ続ける実績の帯。仕組みはテキストのmarqueeと同じでも、品質を決めるのは動きではなく下処理──グレースケール統一と面積合わせを済ませた瞬間、ただの画像列が「信頼の帯」に変わる。",
  params: [
    {
      key: "speed",
      label: "speed(流れる速さ px/秒)",
      min: 20,
      max: 140,
      step: 10,
      default: 60,
      desc: "40〜80で社名が読める。テキストのmarqueeより一段遅くが基本。速いと「読ませる気のない飾り」になる。",
    },
    {
      key: "gap",
      label: "gap(ロゴ間の余白 px)",
      min: 24,
      max: 120,
      step: 8,
      default: 64,
      desc: "48〜80が目安。詰めると各社のロゴがくっついて見え、ロゴ規定違反にもなりやすい。",
    },
    {
      key: "fade",
      label: "fade(両端のフェード幅 px)",
      min: 0,
      max: 140,
      step: 10,
      default: 80,
      desc: "mask-imageで端を溶かす幅。0だとロゴがスパッと見切れて既製ウィジェット感が出る。",
    },
    {
      key: "hoverPause",
      label: "hoverPause(ホバー時の挙動)",
      min: 0,
      max: 1,
      step: 1,
      default: 1,
      options: ["off", "pause"],
      desc: "社名を確かめたい閲覧者のための停止。実績訴求が目的なら止められる方が誠実。",
    },
  ],
  promptTemplate: `クライアントロゴが横に流れ続ける logo marquee(ロゴウォール)を実装してください。

- ロゴ+余白 {{gap}}px を1セットとし、コンテナ幅+1セット分を覆える回数だけ複製する
- requestAnimationFrame で transform: translateX を毎秒 {{speed}}px 進め、セット幅の剰余で巻き戻して継ぎ目を消す
- ロゴは filter: grayscale(1) で無彩色に統一し、opacity を0.7前後に揃える(各社の原色を画面に持ち込まない)
- 各ロゴは高さを揃えるのではなく「見た目の面積」が揃うよう個別に縮尺を調整する(横長ロゴは高さを下げる)
- 帯の左右 {{fade}}px を mask-image の linear-gradient で透明にフェードさせ、端の見切れを隠す
- ホバー時の挙動は {{hoverPause}}(pause の場合はタッチでも停止・再開できるようにする)
- 複製したセットには aria-hidden を付け、スクリーンリーダーには1セット分だけ読ませる
- prefers-reduced-motion 時はアニメーションを停止し、静的なロゴ一覧として表示する`,
  ngExample: {
    say: "「クライアントのロゴを横に流しておいて」",
    why: "速度・止め方・ロゴの下処理がすべて未定義。原色のロゴがサイズもバラバラのまま流れる「実績はあるのに安っぽい」帯が返ってくる。ロゴウォールの品質は動きよりグレースケール統一と面積合わせの下処理で決まる。",
  },
  okExample: {
    say: "「logo marqueeを実装。全ロゴをgrayscale(1)+opacity 0.7で統一し面積が揃うよう個別縮尺、gap 64pxで毎秒60px、剰余で巻き戻し、両端80pxをmaskでフェード、ホバーで一時停止、reduced-motionは静止一覧」",
    why: "下処理(無彩色化・面積合わせ)・速度の単位・端の処理・止め方まで指定している。特に「grayscaleで統一」の一言があるかどうかで、帯の品位が別物になる。",
  },
  vocab: [
    {
      term: "logo wall",
      desc: "実績・導入企業のロゴを並べるセクションの呼び名。流す場合はlogo marquee、logo carouselとも呼ばれる。",
    },
    {
      term: "grayscale統一",
      desc: "filter: grayscale(1)で全ロゴを無彩色化する下処理。各社の原色が並ぶとページの色設計が壊れるため、品位を保つ定番の作法。",
    },
    {
      term: "面積合わせ",
      desc: "高さではなく「見た目の面積」を揃えるサイズ調整(optical sizing)。同じ高さでも横長ロゴは大きく、正方形ロゴは小さく見える。",
    },
    {
      term: "mask-image",
      desc: "要素の透明度をグラデーションで制御するCSS。帯の両端をフェードさせ、ロゴが唐突に見切れるのを隠す。",
    },
  ],
  related: ["marquee", "scroll-marquee", "duotone-hover"],
};
