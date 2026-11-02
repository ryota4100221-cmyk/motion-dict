import type { MotionEntry } from "@/lib/types";

export const chaseLights: MotionEntry = {
  slug: "chase-lights",
  category: "media",
  nameJa: "電飾チェイス",
  nameEn: "chase lights / chaser lights / marquee bulbs",
  lede: "看板の縁に並べた電球を2〜4組に分け、組ごとに同じ明滅を周期の等分だけずらして、暗い所が縁を一周して追いかけて見える劇場・映画館の電飾。光が回る正体は「隣り合う電球の位相差」だけで、全部を同じ瞬間に点滅させると祭りの電飾ではなく故障した看板に見える。",
  params: [
    {
      key: "cycle",
      label: "cycle(1つの電球が明滅する周期 s)",
      min: 0.4,
      max: 3,
      step: 0.1,
      default: 1.2,
      desc: "1〜1.5sが劇場の看板らしい速さ(出典 1.2s)。0.6sを切ると点滅が目に刺さり、2.5sを超えると回っていることに気付かれない。",
    },
    {
      key: "groups",
      label: "groups(位相をずらす組の数)",
      min: 2,
      max: 4,
      step: 1,
      default: 3,
      desc: "3組が定番(出典は nth-child(3n) で3組)。2組だと交互の点滅に見えて向きが読めず、4組以上は暗い所が細くなって流れが弱まる。電球の数はこの数の倍数にすると角で継ぎ目が出ない。",
    },
    {
      key: "dim",
      label: "dim(いちばん暗いときの明るさ %)",
      min: 0,
      max: 80,
      step: 1,
      default: 25,
      desc: "20〜35%が目安(出典 25%)。0にすると電球が消えて歯抜けに見え、50%を超えると明滅が弱くなって光が回らない。",
    },
    {
      key: "direction",
      label: "direction(光が回る向き)",
      min: 0,
      max: 1,
      step: 1,
      default: 0,
      options: ["clockwise", "counterclockwise"],
      desc: "暗い所が縁を回る向き。左上から右へ数えた電球の順に遅らせると時計回り、逆順に遅らせると反時計回りになる。",
    },
  ],
  promptTemplate: `看板の縁に chase lights(電球を組に分けて位相をずらし、光が縁を一周して追いかける電飾)を実装してください。

- きっかけ: 表示した時点で常時ループする(操作は要らない)。「Switch off」ボタンで全部の電球を18%の明るさに落として止め、「Switch on」ボタン(または看板のクリック/タップ)で点け直す。点け直すたびに電球が1個ずつ順に点いていき、そのまま明滅のループに入る
- 電球は看板の縁に等間隔で並べ、左上の角から時計回りに 0,1,2… と番号を振る(例: 上辺13個・右辺5個・下辺13個・左辺5個の計36個)。電球の数は {{groups}} の倍数にして、角で継ぎ目が出ないようにする
- 明滅は全電球で1つの @keyframes を共有する: 0% と 100% で opacity 1、33% で opacity {{dim}}%。{{cycle}}s・linear・infinite で回す
- 電球 i の組は k = i % {{groups}}。animation-delay は {{direction}} が clockwise なら k × ({{cycle}}s ÷ {{groups}}) − {{cycle}}s、counterclockwise なら (({{groups}} − k) % {{groups}}) × ({{cycle}}s ÷ {{groups}}) − {{cycle}}s にする(負の delay で最初の1フレームから位相がずれた状態で始める)
- 点け直し: 電球を包む要素に、opacity 0.18→1 を 0.2s で1回だけ再生するアニメーションを付け、delay を i × 18ms にする(明滅はその内側の要素で回し続ける)
- 電球は光の芯(小さな円)とにじみ(radial-gradient の円)を重ねた要素にし、動かすのは opacity だけにする(box-shadow や filter をアニメーションさせない)
- prefers-reduced-motion 時は明滅も順に点く演出も止め、全部の電球を点いたまま静止させる`,
  ngExample: {
    say: "「看板のまわりの電球をチカチカ光らせて、劇場っぽくして」",
    why: "「チカチカ」では全部の電球に同じ animation を当てた一斉点滅が返る。それは光が回らず看板全体が瞬くだけで、劇場の電飾ではなく故障に見える。組の数・ずらす量・暗さの深さ・回る向きのどれも決まらない。",
  },
  okExample: {
    say: "「chase lightsで。縁に36個の電球を並べ、i%3で3組に分けて animation-delay を周期の1/3ずつずらす。明滅は opacity 1→25%(33%地点)→1 を1.2s linear infinite で全電球共有、時計回り。点け直しは i×18ms で順に点灯。opacityのみ、reduced-motionでは点灯したまま静止」",
    why: "光が回る理由(組と位相差)を指定し、周期・暗さ・向き・数を数値で揃えた。電球数を組の倍数にする指定で角の継ぎ目も防げる。",
  },
  vocab: [
    {
      term: "chase lights(チェイサー)",
      desc: "電球を数組に分けて順に明滅させ、光が走って見える電飾。劇場・映画館の看板(marquee)やゲームショーの枠の定番。",
    },
    {
      term: "phase offset(位相差)",
      desc: "同じ周期の明滅を要素ごとに時間でずらすこと。周期を組の数で等分した量ずつずらすと、暗い所が一定速度で移動して見える。",
    },
    {
      term: "nth-child(3n)",
      desc: "3個おきに要素を選ぶセレクタ。:nth-child(3n+1) / (3n+2) / (3n) の3つに別の delay を書くと、HTMLに番号を振らずに3組に分けられる。",
    },
    {
      term: "negative animation-delay",
      desc: "負の delay を付けると、アニメーションが「その秒数だけ進んだ状態」から始まる。表示直後に全電球が揃って光る一瞬を避けられる。",
    },
  ],
  titleAct: { act: "dots-pulse", map: { speed: "cycle", stagger: 0.4 } },
  aliases: ["ピカピカ", "電飾", "劇場の看板", "マーキーライト", "チェイサー"],
  related: ["marching-ants", "twinkle", "flicker-on", "dots-pulse"],
};
