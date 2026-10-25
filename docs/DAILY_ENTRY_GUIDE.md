# DAILY ENTRY GUIDE — 毎朝の辞典項目追加の契約書

毎朝のアニメデモルーティン（クラウドエージェント）が、その日Awwwards系サイトから再現した
アニメーションのうち1つを「動きの伝え方辞典」の正式項目として追加するための手順書。
**このガイドが契約。ここから外れた追加はしない。**

## 0. 前提

- このサイトは営業・SEO資産。項目は「デモの寄せ集め」ではなく「対訳辞典の見出し語」。
- 差別化はTweak-Driven：スライダーを動かすとプロンプトの数値がリアルタイムに変わること。
- mainへの直接push＝即本番公開。**検証（§5）を全部通るまでpushしない。**

## 1. 動きの選定ルール

1. `content/index.ts` の全slugを必ず読み、**既存項目と重複しない動き**を選ぶ。
   「同じ動きの派生」（例: magnetic-hoverの強い版）は重複とみなす。
2. 選定基準（すべて満たすこと）:
   - 汎用性がある（他の案件・サイトでも使い回せる動き）
   - 名前が付けられる（英語圏で通じる呼び名が実在する）
   - 2〜4個の数値パラメータに落とせる（duration / strength / offset など）
   - CSS/JS（React）だけでデモを再現できる。WebGL必須の動きは当面スキップ対象
3. その日のサイトに辞典向きの新規の動きが1つもない場合は**追加をスキップしてよい**。
   スキップ時はSlack報告にその旨と理由を書く。無理に水増ししない。

## 2. 触るファイル（5点セット＋2つのindex）

新項目 `example-motion` を追加する場合:

| ファイル | 内容 |
|---|---|
| `content/example-motion.ts` | `MotionEntry` データ（§3） |
| `content/index.ts` | import追加＋`all`配列の**カテゴリ順の位置**（hover→scroll→text→transition→media→ui→loading）に挿入 |
| `demos/ExampleMotion.tsx` | デモ実装（§4） |
| `demos/ExampleMotion.module.css` | デモのスタイル |
| `demos/index.tsx` | `demoRegistry`に `"example-motion": d(() => import("./ExampleMotion"))` を追加（**必ずdynamic登録**。静的importで束ねるとページJSが項目数に比例して太る） |

ページ側（`app/motion/[slug]`・一覧）は登録制で自動反映される。**appディレクトリは触らない。**

## 3. MotionEntry の書き方

型は `lib/types.ts`。検証ルール（`scripts/validate-content.ts`が機械チェック）:

- `promptTemplate` 内の `{{key}}` と `params` の key は**完全一致**（未使用パラメータも、未定義トークンも不可）
- `promptTemplate` に **reduced-motion への言及必須**
- `options` 付きパラメータは `min=0 / max=options.length-1 / step=1`、値はindex
- `default` は min/max の範囲内
- `related` は実在するslugのみ・自分自身は不可
- `vocab` は3項目以上
- `ngExample` / `okExample` は say / why すべて必須
- 🔴 `titleAct`（見出しの演技）と `aliases`（検索の別名 3〜5語）が必須（2026-10-26〜・書き方は末尾の「2026-10-26 追加」）

文体・粒度は既存項目（`content/underline-reveal.ts` が良い見本）に必ず目を通して合わせる:
- `lede`: 1〜2文。「どんな動きか＋何が効くか」。である調。
- `desc`（パラメータ）: 実務の目安を数値で（例:「0.3〜0.5sが自然」）。
- `promptTemplate`: 実装方式（transform使用・リフロー禁止等）まで指定した、そのままAIに渡せる文。
- `ngExample.why`: 曖昧に頼むと何が返ってくるかを具体的に。
- `vocab`: その動きを説明するのに必要な専門用語の対訳。

## 4. デモ実装の規約

- `"use client"`。propsは `{ params: ParamValues }` のみ。
- `components/motion/DemoStage` で必ずラップし、`hint` にPC/スマホの操作方法を書く。
- requestAnimationFrame を使う場合は自前で回さず `lib/raf.ts` に相乗りする。
- CSS Modules（**Tailwind不使用**）。カラーは既存の CSS 変数（`--sumi` / `--ai` / `--line` 等）を使う。
- `prefers-reduced-motion` に必ず対応（既存デモの `useReducedMotion` パターンを踏襲）。
- タッチデバイス対応（hover系は `onTouchStart` でトグル等）。
- 実装前に既存デモを最低1つ全文読み、流儀（構成・命名・コメント量）を合わせる。

## 5. push前の検証（全部必須）

```bash
npm ci
npm run validate   # コンテンツ整合性
npm run lint       # ESLint
npm run build      # 型エラー・ビルド失敗はここで捕まえる
```

**1つでも落ちたらpush禁止。** 直せない場合は追加をスキップし、Slack報告に理由を書く。
（CIはlint+validate＋**静的export build**を回し、成功すると **GitHub Pages** に公開＝`/demo/<slug>` と `/videos/*.mp4`。2026-07-22にNetlify→GitHub Pagesへ移行済み。ローカルでbuildを通さずにpushするとPagesデプロイが失敗する。）

## 6. コミット規約

- ブランチ: `main` に直接push（Ryota承認済みのフル自動運用）
- メッセージ: `entry: <slug> — <nameJa>（YYYY-MM-DD）`
- 本文に出典（観察元サイト名とURL、またはWebSearchベースの場合はその旨）を書く

## 7. 報告

Slack通知には以下を含める:
- 追加した項目名（nameJa / slug）とライブデモURL `https://ryota4100221-cmyk.github.io/motion-dict/demo/<slug>`
- 出典サイト
- スキップした場合はその理由

> 辞典本体（Framer CMS）への同期は skill の仕事ではなく、`daily.sh` が push後に `scripts/sync-to-framer.mts` で自動実行する（録画→動画push→CMS upsert）。Framerの辞典項目URL `https://motion-dict.framer.website/entries/<slug>` は同期完了時に daily.sh が別途Slack通知する。

## 2026-10-24 追加：録画v2と、デモで踏んだ本番の不具合2型

### 録画の台本 `rec/<slug>.json`（6点目のファイル）
一覧のカードと詳細ページは、`/stage/<slug>/`（ステージ全面の裸デモ）を **台本どおりに操作して撮った** ループ動画を使う（`scripts/record-v2.cjs`）。
台本が無いとヒント文から推定した汎用操作になり、見せ場が写らないことが多い。**項目を足す日は台本も書く。**
書式・良い台本の基準は既存の `rec/*.json` を見本にする（`rec/magnetic-hover.json`・`rec/accordion.json`）。要点：
- 3〜7秒で名前どおりの動きがはっきり見える／最初の動きまで0.3秒以内／**始まりと終わりが同じ状態**（開いたら閉じる・スクロールしたら戻す）
- 中身が小さいデモは `"zoom": 1.2〜1.8`。座標は画面比 0〜1。画面の外（<0, >1）は指定しても端で止まる
- 撮ったら `python3 scripts/rec-qa.py public/v2/videos/<slug>.mp4 /tmp/qa.png` で数値とコマ画像を確かめる

### 🔴 デモの書き方の禁止2つ（`npm run validate` が検出して落とす）
1. **素材を `"/demo/..."` で参照しない** → GH Pages（basePath `/motion-dict`）で404。`"/motion-dict/demo/photo-01.jpg"` と書く。
   2026-10-24 に20ファイル以上で画像が出ていなかった。
2. **`@property` で登録するカスタムプロパティはデモ固有の接頭辞を付ける**（例 `--ai-orb-angle`）。
   `@property` は文書全体に効くので、`--angle` のような汎用名は他のデモの同名変数を壊す（barber-pole の縞・moire-drift の傾きが消えていた）。

## 2026-10-26 追加：今のデザインの決まりと、新項目に必ず書く2つの欄

一覧・詳細は 2026-10-25〜26 の作り直し（r7・r8）で「紙と活字の辞典」の見た目に揃えた。毎朝の新項目もこの決まりで作る。
**ここに書いたことを外すと、新項目だけが古い見た目・別の世界の言葉で並ぶ。**

### A. デモの絵（写真）
- 写真は **`public/demo/photo-01.jpg`〜`photo-18.jpg` だけ**を使う（紙・本・活字・タイプライター・刷り物・製図の、粒子のあるモノクロ。出典と処理は `public/demo/PHOTO_CREDITS.md`）。
  外の画像・新しい写真・picsum 等の直リンクを足さない。参照は `"/motion-dict/demo/photo-07.jpg"`（`/demo/...` は404＝validate が落とす）。
- **同じ章（category）で直前の項目と同じ写真を使わない。** 直前の項目＝`content/index.ts` の並びで同じ category の1つ前。何を使っているかは
  `grep -o "photo-[0-9]*" demos/<直前のデモ>.tsx demos/<直前のデモ>.module.css | sort -u` で見る。枚数が要るデモ（格子・積み重ね）は、直前と重ならない組を選ぶ。
- **写真に色を付けない。** filter: hue-rotate / sepia・色の乗算・ライムの被せ（mix-blend で色を混ぜる）をしない。**ライム（アクセント）は印だけ**（下線・点・選択中の印・進み具合のバー）。
- **写真が主役のデモは舞台いっぱいに敷く**：写真の要素（または額縁）に `data-md-bleed=""` を付け、舞台の全面（`inset: 0`・`object-fit: cover`）に置く。
  小さなカードを舞台の真ん中に浮かせない。測る＝`NODE_PATH=~/projects/mona-cafe/node_modules node scripts/photo-coverage.cjs <base> <slug>`（写真が舞台に占める面積比。既存の写真主役のデモと比べる）。
  ホバーで出るカード等、写真が部品のデモはこの限りではない（舞台高の66%程度）。

### B. デモの中の言葉
- 仮のブランド名（ATLAS・Monaka 等）・`Hover me`・`Click me`・`Lorem ipsum`・`Page A / Page B`・`Item 1` を**使わない**。
- **辞典の世界の言葉**で書く：動きの名前（`Split text reveal`）・擬音（`ふわっと`）・`Index` / `Glossary` / `Folio` / `Plate` / `Colophon` / `Entry 042` / 見出し語 など。
- ボタン・操作の文言は**何が起きるか分かる英語の Sentence case**（`Open index` / `Show next plate` / `Copy prompt`）。全部大文字・Title Case にしない。
- 機械で見る：`grep -nE "ATLAS|Hover me|Click me|Lorem|Page [AB]\b" demos/<Name>.tsx` が0件（画面に出る字。CSSのコメント・台本の note は対象外）。

### C. ポスター
- ポスター（一覧のカード・og:image）は **録画v2 がカーソルを出さない2本目を撮り、そこから「止まって読めるコマ」を選ぶ**（`scripts/record-v2.cjs`→`poster-pick.py`。何もしなくてよい）。
  台本 `rec/<slug>.json` は、その2本目でも見せ場が写るよう**始まりと終わりを同じ状態に**する（§2026-10-24）。
- 一覧の下地（96×54 の縮小画像）と暗いポスターの明るさ補正は、ポスターから **`scripts/poster-derive.py` が作る**（`sync-to-framer.mts` が録画の後に自動で流す）。
  ポスターを手で撮り直したときは `python3 scripts/poster-derive.py <slug> && npx tsx scripts/export-entries-json.mts` を流す（流し忘れは export が警告する）。

### D. 新しい欄 `titleAct`（見出しの演技）
詳細ページの見出し（h1）と一覧のカード名は、**その項目の動きを文字で演じる**。演技は Framer のコード（`framer/EntryTitle.tsx` の対応表 `SPEC`）にある**既存の型**から選ぶ。
新しい型は作らない（コードを触らない）。**見出しの文字で演じられる、いちばん近い型**を選び、値の対応を書く。

```ts
titleAct: { act: "scroll-fade-in", map: { distance: "distance", duration: "duration", stagger: "stagger*1000" } },
```
- `act`：型の名前＝**既存項目の slug**（`grep -n '^    "' framer/EntryTitle.tsx` で一覧。`["C", …]` と書かれた項目は型として選んでも章扉の演技になる）
  か `"C:<章>"`（hover / scroll / text / transition / media / ui / loading。文字に移せる近い型がどうしても無い時だけ。章扉と同じ演技）。
- `map`：**型の値の鍵 → この項目の値の鍵**。型の項目（`content/<act>.ts`）の params の key を左に、自分の params の key を右に書く。
  - 単位が違うときは倍率を付ける：型が ms・自分が s なら `"stagger*1000"`
  - 自分に無い値は数値で固定してよい（`radius: 140`）。書かなかった鍵は、同じ名前の自分の値 → 無ければ型の項目の初期値が使われる
  - 見出しの右上には、型の表示する値（`SPEC` の4つ目）を自分の鍵に戻して出す（固定値の鍵は出ない）
- 選び方：まず**自分の動きの仕組み**（下から順に現れる／横に拭う／回る／弾む／押し込む…）を1語で言い、同じ仕組みの既存項目を探す。
  例：speed-dial（FAB から項目が順に立ち上がる）→ `scroll-fade-in`（語が下から順に浮かぶ・distance / duration / stagger）。
  ホバー中ずっと追う系（magnetic・tilt 等）はポインタを追う型、スクロール量に反応する系はスクロールの型を選ぶ（フラグも型から引き継ぐ）。
- 検査：`npm run validate` が「型が実在する・map の左が型の鍵・右が自分の鍵」を見る。自分の slug は型にできない（新項目は SPEC に無い）。

### E. 新しい欄 `aliases`（検索の別名）
一覧の検索は名前・説明文に加えてこの語でも引く（FV の擬音から来た人が「ぽこぽこ」で探して0件、を作らない）。
```ts
aliases: ["ぽこぽこ", "にょきにょき", "ピョコッ", "FAB", "プラスがバツに"],
```
- **3〜5語**。擬音（ふわっと・ぷるん・シュッ）を2語以上＋俗な言い方（「プラスがバツに」「横から出る」）・略語。`ngExample.say` の口語から拾うと当たる
- ひらがな／カタカナ・小書き・長音のゆれは検索側で畳むので、表記の揺れ違いを並べない。`,` `|` `:` は使えない
