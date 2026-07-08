import type { MotionEntry } from "@/lib/types";

export const crossfade: MotionEntry = {
  slug: "crossfade",
  category: "transition",
  nameJa: "クロスフェード",
  nameEn: "crossfade / dissolve",
  lede: "2つの要素を重ね、opacityで溶かし混ぜるもっとも基本のトランジション。入ってくる側にわずかなスケール戻しを足すだけで、ただのフェードが「奥からピントが合う」ような上質なディゾルブに変わる。",
  params: [
    {
      key: "duration",
      label: "duration(切替時間 s)",
      min: 0.2,
      max: 2,
      step: 0.05,
      default: 0.8,
      desc: "0.6〜1sがなめらか。2sに近づくと半透明の中間状態が長く見えて眠くなる。",
    },
    {
      key: "zoomIn",
      label: "zoomIn(入り側の初期スケール)",
      min: 1,
      max: 1.15,
      step: 0.01,
      default: 1.05,
      desc: "1.0で純粋なフェード。1.03〜1.08の微差が品よく効く。",
    },
  ],
  promptTemplate: `画像の切り替えに crossfade を実装してください。

- 2枚を同じ枠内に position: absolute で重ね、opacityの0/1を入れ替える
- 切り替え時間は {{duration}}s。opacityはease、transformはcubic-bezier(0.16, 1, 0.3, 1)
- 入ってくる側は scale({{zoomIn}}) から 1.0 へ戻しながらフェードインする
- 出ていく側のscaleは動かさず、フェード完了後に次回用の初期スケールへ瞬時に戻す
- 重なりの瞬間に背景が透けないよう、枠の背面に不透明な面を敷いておく
- prefers-reduced-motion 時はフェードなしで即座に切り替える`,
  ngExample: {
    say: "「画像をふわっと切り替えて」",
    why: "「ふわっと」では時間もスケールも決まらない。両方が半透明になった瞬間に背景が透けて暗く沈む、切り替えのたびにレイアウトが動く、といった実装が返ってきがち。",
  },
  okExample: {
    say: "「crossfadeを実装。2枚をabsoluteで重ねopacityを0.8sで入替、入り側はscale(1.05)→1.0をcubic-bezier(0.16,1,0.3,1)で戻す。出側のscaleは動かさない」",
    why: "重ね方・時間・easing・入り側だけ動かす非対称まで指定している。「出側は動かさない」の一言がディゾルブの品を守る。",
  },
  vocab: [
    {
      term: "ディゾルブ",
      desc: "映像編集で2つのカットをopacityで溶かし混ぜる転換手法。Webのcrossfadeはこの直系。",
    },
    {
      term: "中間の半透明問題",
      desc: "両方がopacity 0.5前後になる瞬間、背景が透けて全体が暗く見える現象。背面に不透明な面を敷くと防げる。",
    },
    {
      term: "非対称トランジション",
      desc: "入り側と出側で動きを変えること。入りだけスケールを付けると、視線が自然に新しい方へ誘導される。",
    },
    {
      term: "遅延付きリセット",
      desc: "transition: transform 0s 0.8s のように所要時間0+遅延で書くと、「フェード完了後に瞬時に初期値へ戻す」がCSSだけで実現できる。",
    },
  ],
  related: ["curtain-wipe", "image-zoom-hover"],
};
