import type { MotionEntry } from "@/lib/types";

export const snowfall: MotionEntry = {
  slug: "snowfall",
  category: "media",
  nameJa: "スノーフォール（降る雪）",
  nameEn: "snowfall effect / falling snow / snow particles",
  lede: "小さな粒が左右に揺れながら降り続ける、季節演出の定番の常時ループ。雪らしさを決めるのは粒の数より奥行きで、「大きい粒ほど速く・濃く・大きく揺れる」と粒ごとに連動させるだけで、平らな水玉模様が手前と奥のある空間に変わる。",
  params: [
    {
      key: "count",
      label: "count(粒の数)",
      min: 12,
      max: 120,
      step: 4,
      default: 64,
      desc: "ヒーロー1枚分で50〜70粒が目安。アイコンやボタンの上だけに降らせるなら14〜24粒で足りる。100を超えると吹雪になり、本文の可読性を削る。",
    },
    {
      key: "duration",
      label: "duration(基準の落下時間 s)",
      min: 4,
      max: 20,
      step: 0.5,
      default: 10,
      desc: "中くらいの粒が上端から下端まで落ちる時間。8〜12sが「しんしんと降る」速さ。5sを切ると雨やみぞれの速さになり、雪に見えなくなる。",
    },
    {
      key: "sway",
      label: "sway(左右の揺れ幅 px)",
      min: 0,
      max: 30,
      step: 1,
      default: 9,
      desc: "最も手前の粒が左右に振れる幅。奥の粒はこの3割まで小さくする。6〜12pxで舞う感じが出る。0だと真下へ落ちるだけで、雨か砂に見える。",
    },
    {
      key: "depth",
      label: "depth(奥行きの強さ %)",
      min: 0,
      max: 100,
      step: 5,
      default: 80,
      desc: "粒の大きさ・速さ・濃さ・揺れ幅を奥行きで連動させる強さ。70〜100%で手前と奥が分かれる。0にすると全粒が同じ大きさ・同じ速さになり、平らな水玉模様が流れるだけになる。",
    },
  ],
  promptTemplate: `背景に snowfall effect(降る雪)を実装してください。

- きっかけ: ページ読み込み直後から自動で降り続ける(無限ループ・操作不要)
- 雪の粒は {{count}} 個。各粒に奥行き z(0=奥〜1=手前)をシード付き乱数で振り(z = 乱数^1.6 で奥の粒を多めにする)、横位置もランダムに固定する(描画のたびに変えない)
- 奥行きは {{depth}}% の強さで効かせる(実際に使う z = 0.5 + (z − 0.5) × 強さ。0%なら全粒が中間の z に揃う)。次の値をその z に線形で連動させる: 直径 2.5〜6.5px、不透明度 0.3〜0.9、落下時間 {{duration}}s×1.3(奥)〜×0.7(手前)、揺れ幅 {{sway}}px×0.3(奥)〜×1(手前)。大きい粒ほど速く・濃く・大きく揺れること
- 1粒は2層構造にする。外側は落下だけを担当し、translate3d(0,0,0)→translate3d(0,領域の高さ+10px,0) を linear・infinite で動かす。opacity は 0%→10% で立ち上げ、82%→100% で 0 に戻す
- 内側は揺れだけを担当し、translateX(-揺れ幅)→translateX(+揺れ幅) を ease-in-out・alternate・infinite で往復させる。周期は手前 2.6s〜奥 4.9s。1つの animation に落下と揺れを混ぜない(timing-function が違うので破綻する)
- 粒の出現帯は領域の上端より 20〜30px 上に置く。領域内で生まれると粒が「その場に出現して点滅している」ように見える
- 落下・揺れとも animation-delay に負の値(周期×0〜1)を入れ、初回表示の時点で全粒が空中に散っている状態から始める
- 粒は border-radius ではなく radial-gradient(中心 0.95 → 30% で 0.7 → 72% で透明)で描く。2〜3px の円は角丸が効かず四角く見えるため
- 動かすのは transform と opacity のみ(top/left を動かさない=リフロー禁止)。領域は overflow: hidden・pointer-events: none・aria-hidden にする
- 画面外やタブが閉じている間は animation-play-state: paused で止める
- prefers-reduced-motion 時は落下も揺れも止め、粒を空中に散らした静止画として表示する`,
  ngExample: {
    say: "「背景に雪を降らせて」",
    why: "全粒が同じ大きさ・同じ速さで真下へ落ちる、平らな水玉模様が返りがち。1つの keyframes に落下と揺れを混ぜて動きがカクつく実装や、領域の中で粒が湧いて点滅して見える実装、canvas で毎フレーム全粒を描き直す重い実装になることも多い。",
  },
  okExample: {
    say: "「snowfall effectを実装。64粒に奥行きzを振り、大きい粒ほど速く濃く大きく揺れるよう連動(depth 80%)。落下は外側linear 10s基準、揺れは内側ease-in-out alternateで±9px。出現帯は領域の上、負のdelayで初回から散らす。transform/opacityのみ、reduced-motionは静止」",
    why: "「奥行きで大きさ・速さ・濃さ・揺れを連動させる」という雪に見える理由と、落下と揺れを別要素に分ける実装方式を指定している。数・基準速度・揺れ幅が数値で揃うので、吹雪にも雨にもならない。",
  },
  vocab: [
    {
      term: "パララックス(奥行きの連動)",
      desc: "手前の物ほど大きく速く見えるという遠近の手がかり。粒ごとに大きさ・速さ・濃さを同じ z で揃えて動かすと、平面の上でも奥行きが生まれる。",
    },
    {
      term: "2層アニメーション(ネスト)",
      desc: "外側の要素と内側の要素に別々の animation を当て、動きを合成する方法。直線の落下と往復の揺れのように、timing-function や繰り返し方が違う動きを混ぜるときに使う。",
    },
    {
      term: "animation-direction: alternate",
      desc: "1周ごとに再生方向を反転させる指定。from→to→from と往復するので、揺れの keyframes を2点だけで書ける。",
    },
    {
      term: "animation-delay(負の値)",
      desc: "その秒数だけ再生済みの状態から始める指定。待ち時間なしで、最初の1フレームから全粒を空中に散らしておける。",
    },
  ],
  related: ["twinkle", "fog-drift", "floating-reactions", "parallax"],
};
