import type { MotionEntry } from "@/lib/types";

export const cardShuffle: MotionEntry = {
  slug: "card-shuffle",
  category: "media",
  nameJa: "カードシャッフル",
  nameEn: "card stack shuffle / deck cycle",
  lede: "扇状に重ねたカードの一番手前が横へ抜け、傾きながら縮んで束の背面へ回り込む演出。カルーセルと違い「トランプの束」というメタファーが効くので、3〜5枚の少数を省スペースで巡回させたいときに強い。",
  params: [
    {
      key: "interval",
      label: "interval(自動送りの間隔 s)",
      min: 0,
      max: 8,
      step: 0.4,
      default: 3.2,
      desc: "0で自動送りなし。3〜4sが目安。カードに読ませたい文字が載るなら5s以上か、いっそ0にして手動送りにする。",
    },
    {
      key: "duration",
      label: "duration(1枚が背面へ回る時間 s)",
      min: 0.3,
      max: 1.6,
      step: 0.05,
      default: 0.8,
      desc: "0.7〜0.9sが自然。0.5sを切ると「抜けて回り込む」経路が読めず、ただの瞬間入れ替えに見える。",
    },
    {
      key: "fan",
      label: "fan(扇の開き角 deg)",
      min: 0,
      max: 16,
      step: 1,
      default: 9,
      desc: "手前と奥のカードの角度差。8〜10度で「無造作に置かれた束」に見える。0だと完全に重なり枚数が伝わらず、15度を超えると散らかって見える。",
    },
    {
      key: "scaleStep",
      label: "scaleStep(奥のカードの縮小幅)",
      min: 0,
      max: 0.12,
      step: 0.01,
      default: 0.05,
      desc: "1枚奥へ行くごとに縮む幅。0.04〜0.06が上品。0.1を超えると奥のカードが遠くに飛んで見え、束の一体感が切れる。",
    },
  ],
  promptTemplate: `カードの束が1枚ずつ入れ替わる card stack shuffle を実装してください。

- カードは同じ親の中で position: absolute で完全に重ね、手前から順に rotate と scale をずらして扇状に見せる
- 手前を rotate(-{{fan}}deg) scale(1)、以降1枚奥へ行くごとに角度を +{{fan}}deg 側へ寄せ、scale を {{scaleStep}} ずつ小さくする。重なり順は z-index で管理する
- 送り出しは {{duration}}s。手前のカードを一度横（translateX(-90%)程度）へ逃がし、傾きを変えながら縮めて、最奥のカードの静止状態と同じ transform で着地させる
- 送り出しの途中で z-index を最前面から最背面へ落とす（経路の中盤で切り替えると束の下に潜り込んで見える）
- 動かすのは transform と z-index のみ。top/left や DOM の並べ替えでの見た目調整は禁止（リフローさせない）
- 残ったカードは手前へ1段ずつ繰り上げる。transition-delay を 0.1s ずつずらすと束が生きて見える
- 自動送りは {{interval}}秒間隔（0なら自動送りなし）。手動で送ったらタイマーを仕切り直す
- クリック／タップでも次のカードへ送れるようにし、送りボタンには aria-label を付ける
- prefers-reduced-motion 時は自動送りを止め、送り出しのアニメーションもなしで即座に並び替える`,
  ngExample: {
    say: "「カードをトランプみたいにシャッフルさせて」",
    why: "「シャッフル」だけでは、束から抜ける経路も角度も決まらない。カードが単にフェードで入れ替わるだけの実装や、z-indexを最初から落として「束の後ろを通らずに手前で消える」不自然な動きが返ってきがち。DOMを毎回並べ替えて位置がガタつく実装も定番の失敗。",
  },
  okExample: {
    say: "「カードを絶対配置で重ね、手前から rotate(-9deg)/scale(1) で 0.05 ずつ縮小した扇にする。手前の1枚を0.8sで translateX(-90%) へ逃がし、経路の中盤でz-indexを最背面に落として最奥の静止transformに着地。残りは0.1sずつ遅らせて繰り上げ。3.2s間隔で自動送り、transformとz-indexのみ、reduced-motionなら即時入れ替え」",
    why: "扇の作り方（角度と縮小幅）、抜ける経路、z-indexを落とすタイミング、着地点の一致まで指定している。特に「最奥の静止transformに着地させる」の一言が、アニメーション終了と並び替えの継ぎ目を消す。",
  },
  vocab: [
    {
      term: "z-index",
      desc: "重なり順。シャッフルでは「いつ最背面に落とすか」が肝で、経路の中盤で切り替えると束の下へ潜って見える。アニメーション内でも離散値として切り替えられる。",
    },
    {
      term: "扇状に重ねる (fan out)",
      desc: "同じ位置のカードを少しずつ回転・縮小させて束に見せる手法。角度差と縮小幅の2つだけで「枚数がある」ことが伝わる。",
    },
    {
      term: "着地点の一致",
      desc: "送り出しアニメーションの終了状態を、そのカードが次に取る静止状態と同じtransformにすること。ズレると並び替えの瞬間にカクッと飛ぶ。",
    },
    {
      term: "animation-fill-mode: forwards",
      desc: "アニメーション終了後も最終フレームの状態を保つ指定。これがないと終了直後に元の位置へ戻り、並び替えとの間で一瞬ちらつく。",
    },
  ],
  related: ["stacking-cards", "carousel", "flip-card"],
};
