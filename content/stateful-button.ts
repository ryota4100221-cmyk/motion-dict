import type { MotionEntry } from "@/lib/types";

export const statefulButton: MotionEntry = {
  slug: "stateful-button",
  category: "ui",
  nameJa: "送信ボタンの状態遷移（待機→処理中→完了）",
  nameEn: "stateful button / loading button / submit button states / loading-to-success button",
  lede: "押したボタンがその場でスピナーに変わり、処理が終わるとチェックが下から跳ねて入り、数秒後に元のラベルへ戻る一連の演出。結果の通知を別の場所に出さず「押したところ」で返すので、二重送信も「届いたのか分からない」不安も同時に消える。",
  params: [
    {
      key: "loadingTime",
      label: "loadingTime(処理中の時間 s・デモ用の擬似値)",
      min: 0.4,
      max: 3,
      step: 0.1,
      default: 1.2,
      desc: "実装では通信が終わるまでの時間で、ここはデモ用の仮置き。0.3s未満で返る処理はスピナーが一瞬ちらつくだけなので、最低表示時間（0.4〜0.6s）を設けるか、スピナーを出さずに直接完了へ飛ばす。",
    },
    {
      key: "checkDuration",
      label: "checkDuration(チェックが入る時間 s)",
      min: 0.2,
      max: 1,
      step: 0.05,
      default: 0.5,
      desc: "チェックが下から入って弾み、静止するまで。0.4〜0.5sが「届いた」と読める速さ。0.8sを超えると結果を待たされている感じに戻る。",
    },
    {
      key: "rise",
      label: "rise(チェックのせり上がり px)",
      min: 0,
      max: 40,
      step: 1,
      default: 30,
      desc: "チェックが出発する下方向のずれ。ボタンの高さの半分強（高さ52pxなら24〜30px）で、ボタンの下端から湧き上がって見える。0だとその場でフェードするだけになる。",
    },
    {
      key: "holdTime",
      label: "holdTime(完了表示を保つ時間 s)",
      min: 0.5,
      max: 4,
      step: 0.1,
      default: 2,
      desc: "完了のチェックを見せてから元のラベルへ戻すまで。2sが定番（Wixのフォーム部品の実装値）。1s未満は見落とされ、送り直しの操作を誘う。",
    },
  ],
  promptTemplate: `フォームの送信ボタンに stateful button(idle → loading → success)を実装してください。

- 状態は idle / loading / success / error の4つを1つの変数で持つ。クリックを受け付けるのは idle のときだけにする（loading 中の連打で二重送信させない）
- ボタンの幅と高さは idle のラベルに合わせて固定し、中身が入れ替わってもボタン自体の大きさを変えない（周囲のレイアウトを動かさない）
- 中身は「ラベル」「スピナー」「チェック」を同じ位置に重ね、表示する1つだけを切り替える
- loading：ラベルを 0.15s でフェードアウトし、SVGの円のスピナーを出す（円全体は 2s linear で1回転、stroke-dasharray を 1.5s ease-in-out で伸縮）。デモでは {{loadingTime}}s 後に完了させる
- success：背景色を成功色へ 0.3s で切り替え、チェックを {{checkDuration}}s で translateY({{rise}}px)・opacity 0 → 32%で translateY(-5px)・opacity 1 → 68%で translateY(2px) → 0 と、弾んで入れる
- success / error は {{holdTime}}s 表示してから自動で idle に戻す。戻る前に状態が変わったらタイマーは必ずクリアする
- 動かすのは transform / opacity / background-color だけ（width・padding をアニメーションさせない）
- disabled 属性ではなく aria-disabled と aria-busy で状態を伝え、フォーカスをボタンに残す。結果は aria-live="polite" の非表示テキストで「送信しました」と読み上げる
- prefers-reduced-motion 時はスピナーの回転とチェックの弾みを出さず、「送信中…」の文字と完了のチェックを即時に切り替える（状態遷移そのものは残す）`,
  ngExample: {
    say: "「送信ボタンを押したらローディングを出して、終わったら成功って分かるようにして」",
    why: "ローディングと成功の出し方も、いつ元に戻すかも決まらない。ボタンの中身をそのまま差し替えてボタンの幅がガタッと変わる実装や、disabled を付けてフォーカスが外れスクリーンリーダーに何も伝わらない実装、成功表示が出たまま戻らず次の送信ができない実装が返ってきがち。loading 中の連打で二重送信できてしまうことも多い。",
  },
  okExample: {
    say: "「stateful buttonを。状態は idle/loading/success/error、クリックは idle のみ受付。幅は固定、スピナーは 2s 回転＋dash 伸縮、成功時はチェックを 0.5s で translateY(30px)→-5px→2px→0 と弾ませ、2s 後に idle へ自動復帰。aria-busy＋aria-live で読み上げ、reduced-motion は即時切り替え」",
    why: "状態の種類・受付条件・寸法の固定・各状態の動きと尺・戻るまでの時間まで指定。「クリックは idle のみ」「幅は固定」「自動で戻す」の3点で、見た目の演出だけでなく送信UIとして壊れないものが返ってくる。",
  },
  vocab: [
    {
      term: "stateful button / loading button",
      desc: "押した結果（処理中・成功・失敗）をボタン自身の見た目で返すボタン。英語圏では submit button states、progress button、loading-to-success button の名でも通じる。",
    },
    {
      term: "状態機械（state machine）",
      desc: "取りうる状態と遷移を列挙して1つの変数で持つ設計。idle 以外ではクリックを無視する、のような規則が分岐1つで書け、二重送信の防止もここに入る。",
    },
    {
      term: "aria-busy",
      desc: "要素が更新中であることを支援技術に伝える属性。loading 中に true にし、終わったら外す。",
    },
    {
      term: "aria-disabled",
      desc: "操作できないことを伝えつつ、disabled 属性と違ってフォーカスとタブ移動を奪わない属性。処理中のボタンからフォーカスが消えるのを防ぐ。",
    },
    {
      term: "最低表示時間（minimum display time）",
      desc: "処理が速すぎてもスピナーを一定時間は見せる工夫。0.1sだけ出て消えるスピナーは「何かが点滅した」としか読まれない。",
    },
  ],
  related: ["press-feedback", "spinner-ring", "checkbox-check", "error-shake"],
};
