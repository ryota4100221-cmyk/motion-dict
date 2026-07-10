import type { MotionEntry } from "@/lib/types";

export const circleReveal: MotionEntry = {
  slug: "circle-reveal",
  category: "transition",
  nameJa: "サークルリビール",
  nameEn: "circle reveal / clip-path circle transition",
  lede: "クリック地点から円が広がり、次の画面が中から現れるページ遷移。clip-pathのcircle()を0%→150%へ動かすだけで実装でき、「押した場所から世界が切り替わる」因果が体感として伝わるのが強み。",
  params: [
    {
      key: "duration",
      label: "duration(円が広がる時間 s)",
      min: 0.4,
      max: 1.2,
      step: 0.05,
      default: 0.6,
      desc: "0.5〜0.8sが目安。円は面積が半径の2乗で増えるため、体感は数値より速く感じる。",
    },
    {
      key: "origin",
      label: "origin(円の発火原点)",
      min: 0,
      max: 3,
      step: 1,
      default: 0,
      options: ["click", "center", "top-left", "bottom-right"],
      desc: "clickはクリック地点が円の中心になる。ボタン起点ならclick、演出優先ならプリセットを使う。",
    },
  ],
  promptTemplate: `ページ遷移に circle reveal を実装してください。

- 次の画面を最前面のレイヤーとして重ね、clip-path: circle(0% at 原点) で完全に隠しておく
- 発火原点は {{origin}}(clickの場合はクリック座標を要素内の%に変換して at に渡す)
- 発火したら clip-path を circle(150% at 原点) まで {{duration}}s で広げる(150%なら原点が四隅でも画面全域を覆える)
- easingは cubic-bezier(0.4, 0, 0.2, 1) のようなease-in-out系を使う
- アニメーションは clip-path のみで行い、width/heightやborder-radiusの変形でリフローさせない
- 広がり切ったら下の旧画面レイヤーを破棄し、clip-pathを外して通常表示に戻す
- prefers-reduced-motion 時は円を出さず、即時切り替えまたは短いフェードにする`,
  ngExample: {
    say: "「クリックしたら丸く広がって画面が切り替わるやつを作って」",
    why: "原点・最終半径・時間がすべて未定義。中央固定の円しか出ない、半径100%指定で四隅が覆い切れず旧画面の角が残る、円形divをscaleで拡大して端がぼやける、といった実装が返ってきやすい。",
  },
  okExample: {
    say: "「circle revealを実装。次画面をclip-path: circle(0% at クリック座標)で重ね、0.6sのease-in-outでcircle(150%)へ。clip-pathのみで動かし、完了後はclip-pathを外して旧画面を破棄。reduced-motionは即時切替」",
    why: "原点の決め方・最終半径・時間・後始末まで指定できている。「150%」の一言が四隅の覆い残し事故を防ぐ。",
  },
  vocab: [
    {
      term: "clip-path: circle()",
      desc: "要素を円形に切り抜くCSS。circle(半径 at x y) の半径を動かすだけで円形遷移になる。切り抜きなので中身は変形しない。",
    },
    {
      term: "発火原点(origin)",
      desc: "円が広がり始める中心点。クリック座標をatに渡すと「押した場所から開く」因果が生まれ、遷移の理由が伝わる。",
    },
    {
      term: "半径150%",
      desc: "原点が画面の隅にあっても対角まで届く安全値。100%では覆い残しが出ることがあるため、最終半径は余裕を持たせる。",
    },
    {
      term: "面積の非線形",
      desc: "円の面積は半径の2乗で増えるため、線形に半径を動かしても後半が一気に開いて見える。easingは強くかけすぎない。",
    },
  ],
  related: ["menu-reveal", "curtain-wipe", "clip-reveal"],
};
