import type { MotionEntry } from "@/lib/types";

export const dragScroll: MotionEntry = {
  slug: "drag-scroll",
  category: "media",
  nameJa: "慣性ドラッグスクロール",
  nameEn: "drag scroll / kinetic scrolling / momentum drag",
  lede: "ギャラリーを掴んで放り投げると、慣性でスーッと滑って減速しながら止まる横スクロール。指の動きに1:1で追従し、離した瞬間の速度を引き継いで滑らせるのがキモ。Awwwards系の作品ギャラリーで定番の「気持ちよさ」の正体。",
  params: [
    {
      key: "friction",
      label: "friction(減衰率)",
      min: 0.85,
      max: 0.98,
      step: 0.01,
      default: 0.94,
      desc: "1フレームごとに速度へ掛ける係数。0.94前後が自然。0.9未満はすぐ止まり、0.97以上は長く滑りすぎて止め所を失う。",
    },
    {
      key: "throw",
      label: "throw(投げの増幅)",
      min: 1,
      max: 4,
      step: 0.5,
      default: 2,
      desc: "指を離した瞬間の速度を何倍にして放り出すか。1で実速度どおり、2〜3で軽いフリックでも遠くまで滑る。上げすぎると行き過ぎて端で急停止する。",
    },
  ],
  promptTemplate: `横並びのギャラリーに drag scroll(慣性スクロール)を実装してください。

- Pointer Events(pointerdown/move/up)で実装し、マウスとタッチを1つの経路で扱う。pointerdown時に setPointerCapture する
- ドラッグ中はポインタの移動量ぶんだけトラックを translateX で動かす(指に1:1で追従)。left/margin は使わずリフローさせない
- 直近フレームの移動量を速度として保持しておく
- 指を離したら、その速度を {{throw}} 倍にして初速とし、毎フレーム translateX に加算する慣性ループを回す
- 速度は毎フレーム {{friction}} を掛けて減衰させ、|速度| が十分小さくなったらループを止める
- 移動範囲は 0 〜 -(トラック幅 - 表示幅) にクランプする。端に達したら速度を0にして止める(端で弾ませたい場合は rubber-band を別途重ねる)
- 慣性ループは requestAnimationFrame で回し、ページ内に既にrAFループがあるなら1本に相乗りさせる
- カーソルは grab / ドラッグ中は grabbing。テキスト選択と画像ドラッグは無効化する(user-select:none / draggable=false)
- prefers-reduced-motion 時は慣性を無効化し、指を離した位置で即座に止める(ドラッグ追従だけ残す)`,
  ngExample: {
    say: "「ギャラリーをドラッグで動かせるようにして」",
    why: "「ドラッグで動く」だけでは、離した瞬間にピタッと止まる無味乾燥な実装になりがち。慣性(離した速度を引き継いで滑る)と減衰(だんだん止まる)が抜けると、この動きの気持ちよさは丸ごと消える。",
  },
  okExample: {
    say: "「Pointer Eventsでdrag scrollを実装。ドラッグは1:1追従、離したら速度をthrow 2倍にして初速に、毎フレームfriction 0.94で減衰させて滑らせる。範囲はクランプ、rAFは1本に相乗り、reduced-motionは慣性オフ」",
    why: "追従方式・慣性の初速・減衰率・範囲クランプまで数値と方式で指定している。「離した速度を引き継ぐ」「毎フレーム掛けて減衰」の2点が、ただのドラッグと慣性スクロールを分ける核心。",
  },
  vocab: [
    {
      term: "慣性スクロール(kinetic scrolling)",
      desc: "指を離した後も、離した瞬間の速度を引き継いで滑り続ける挙動。スマホのネイティブスクロールで体に染み付いた「当たり前の気持ちよさ」の正体。",
    },
    {
      term: "friction / 減衰",
      desc: "毎フレーム速度に掛ける1未満の係数。1に近いほど長く滑り、小さいほど早く止まる。止まり方の上品さはこの1値で決まる。",
    },
    {
      term: "velocity(速度サンプリング)",
      desc: "直近フレームの移動量から求める瞬間速度。これを放す瞬間に確定させ、慣性ループの初速にする。取り損ねると「投げた感」が出ない。",
    },
    {
      term: "Pointer Capture",
      desc: "pointerdownした要素にポインタを固定するAPI。指がステージの外へ出てもmove/upを取り続けられ、掴んだまま画面外へ振り抜く操作が破綻しない。",
    },
  ],
  related: ["carousel", "velocity-skew", "rubber-band"],
};
