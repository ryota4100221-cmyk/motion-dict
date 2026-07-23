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
