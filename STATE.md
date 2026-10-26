# motion-dict v2 ブラッシュアップ（2026-10-24〜）— 再開はここから

<!-- checkpoint:begin -->
- 状態: 公開済
- 更新: 2026-10-26
- いまここ: Awwwardsループ8周で独立レビュー2人とも D・U・C ≥7.0（7.34/7.40）→本番反映済。新項目もデータ（titleAct・aliases・下地自動生成）で同じルールに。コンタクトエリアは営業CTAをやめ「この辞典について／編者／版／写真」の静かな形に変えて本番反映済。
- 次の一手: 翌朝7:30の自動追加後、本番の新項目ページを開き、見出しが自分の動きを演じる・擬音で引ける・一覧に下地が出るかを見る（validate で止まっていないかも GH Actions で確認）
- 所要: 15分
- 待ち: 翌朝の毎朝ルーティン（anime-demo）の実行
<!-- checkpoint:end -->

## 2026-10-26 本番反映とその後
- 本番（PnTJSNS3Yi1gInF6kBFb）に r8 を反映・publish（詳細は下の「Awwwards ループ → 本番反映」節）。
- 新項目のデータ化（9d7f296）：content に `titleAct`・`aliases` を必須化（validate-content が落とす）。`scripts/poster-derive.py` が下地LQIP・明るさ補正を生成→`public/v2/derived/`・`public/v2/lqip.json`。entries-v2.json に titleAct/aliases/defaults/dim。コンポーネントはデータ優先・無ければ定数。手順書＝anime-demo-daily SKILL.md STEP5・docs/DAILY_ENTRY_GUIDE.md 末尾「2026-10-26 追加」。
  - 本番で speed-dial（今朝の新項目）を確認：見出しが自分の動き（scroll-fade-in）・「ぽこぽこ」で検索ヒット・下地あり。
  - 手書きのまま残したもの：PF_READ・Y_TABLE（着地時に自己補正）・PICK（格子に出す項目＝新項目は索引行へ）。
- 罠：sync-to-framer が `public/v2/meta/<slug>.json`・`public/rec/<slug>.json` を未追跡で残し、翌朝の `git pull` を止めていた → 2fe3fe2 で git add に追加。
- コンタクトエリア（SiteFooterCTA.tsx）：特大見出し「この動き、サイトに入れたい。」＋ライムの相談ボタンをやめ、生成り地に「動きの伝え方辞典／この辞典について／編者・版・写真／monaka design.・X・お仕事の相談（文字リンク）」。版の日付と項目数は entries-v2.json の件数と Last-Modified から自動。Ryota指示で「奥付 Colophon」の表示は削除。PC は文節で折り返し・SP は通常。本番 publish 済（93cc099）。
- 判断待ち（Ryota）：有料プランで Made in Framer を外す＋独自ドメイン／英語併記／duotone-hover の静止状態のライム。
- 次に伸ばすなら（レビュアーの次の手）：FVを題字＋擬音だけに絞る／章の境目をその章の動きでめくる／索引サムネを明るい1コマに。
- 一時ファイル：採点スクショ等は ~/projects/motion-dict-v2-blind（スクラッチパッドへのリンク・セッション終了で消える）。複製 4FmgcacdTtjanKiZQCuP は検証用に残置（noindex）。複製CMSには毎朝の新項目が入らない。

## 2026-10-25 r7 デモの絵を「紙と活字」に（prompt-trigger ブランチ・未push）
- 写真：public/demo/photo-01〜18（Unsplash License・picsum経由・粒子のあるモノクロ）。再現＝scripts/photos-paper.py／出典＝public/demo/PHOTO_CREDITS.md
  ※ Unsplash 本体はボット検査（Anubis）で取得不可＝picsum の Unsplash 写真から選んだ（18枚）
- 割り振り：1枚あたりの使用デモ数の最大 22→8、隣接項目の写真かぶり 17組→1組（stagger-grid↔spiral-reveal：12+9枚で18枚を超えるため不可避）
- 仮の言葉：ATLAS/Hover me/Monaka/Lorem の grep 9ファイル→0。索引・見出し語・Folio・Plate・Colophon 等に置換（rec の text= セレクタも追従）
- 舞台いっぱい：写真が主役の12本を data-md-bleed で全面に、ホバーカード3本は舞台高の66%。測定＝scripts/photo-coverage.cjs
- ポスター：録画v2 がカーソル無しの2本目を撮り、そこから「止まって読めるコマ」を選ぶ（poster-pick.py）。白丸 121/196→0（scripts/poster-cursor-check.py）
- 全196件を撮り直し済。record-all-v2.sh は xargs -I が長すぎて1件も撮らずに「done」を出していた→修正
- 判断待ち：duotone-hover は静止状態で写真にライムを被せる（デモの主題）。「写真に色を付けない」と衝突。ポスターはホバー後（無彩色）のコマが選ばれている

## 🟢 2026-10-25 本番移行済（Ryota「本番に入れていいよ」）
- 本番 Framer（PnTJSNS3Yi1gInF6kBFb）へ v2 を反映・publish 済。手順は下の「本番移行の手順」どおり。
  本番で新規ノードのIDは複製と違う（dTop=PTWVjbb6m / hReel=yoE4M8laN / Prompt Raw=HybwCt26x / Params JSON=Hxba1_vhG
  / コード EntryLab=zIMde6u・EntryNav=fsJycbH・MotionDictionaryV2=U09rbnd・EntryTitle=ku8r2xA・SiteFooterCTA=wi8lhIo・HeroReel=eXBofvM）。
  本番と複製の serialize を突き合わせて差分ゼロ（IDと件数以外）を確認済。
- main = v2（毎朝パイプラインもv2：録画v2→ループ回転→Posterはv2のコマ）。以後は main で作業してよい。
- 和文フォント 400/700 の2ウェイトに（Ryota「ウェイト減らそうか」）：1ページ 6.6MB→4.4MB。framer/fonts-canvas.js
- デモの絵を写真に（Ryota「写真そっちで入れてほしい」）：public/demo/photo-01〜08.jpg（Unsplash License・PHOTO_CREDITS.md）。
  47本を差し替えて録画v2撮り直し・Poster(og:image)も差し替え（framer/og-some.js）。
  写真を入れていないもの＝文字・UI部品が主役のデモ（halftone 等）。skeleton-shimmer は録画では骨組みのまま（クリックで写真）。
- 残りの判断：Framer有料プラン＋独自ドメイン／既定言語→日本語（UIのみ）／辞典の「署名」。


## 2026-10-26 slug 別の表をデータへ（prompt-trigger・未push／Framer 未反映）
- 新項目（speed-dial）が表に無く、見出しが章扉の演技・擬音検索0件・下地なしだった → content に titleAct / aliases（全197件・既存は表から機械で書き戻し）、
  ポスターから下地・明るさ補正を作る scripts/poster-derive.py（public/v2/derived/・下地は public/v2/lqip.json）。export が entries-v2.json / entry/<slug>.json に載せ、
  MotionDictionaryV2 / EntryTitle はデータ優先・無ければ定数。毎朝は sync-to-framer が derive→export→push。規則は docs/DAILY_ENTRY_GUIDE.md 末尾「2026-10-26 追加」
- 反映に要るもの：main へ push（GH Pages）＋ Framer のコードファイル2本（MotionDictionaryV2・EntryTitle）を上げて publish

## ✅ Awwwards ループ → 本番反映（2026-10-26・Ryota「本番に出していいよ」）
- 8周（毎周 初見レビュアー2人）。r8＝A 7.34（D7.0 U7.5 C7.2）／B 7.40（D7.2 U7.6 C7.0）＝2人とも D・U・C ≥ 7.0。
- 本番 PnTJSNS3Yi1gInF6kBFb に反映・publish 済。コード6本（MotionDictionaryV2 / HeroLive=qluOwqe 新規 / EntryTitle / EntryLab / EntryNav / SiteFooterCTA）。
- 本番のキャンバス変更：Hero の h1 jCG_TzbUJ → HeroTitle uMPxFGDU5（maxSize 176）、HeroReel yoE4M8laN → HeroConsole JwtrfD_Pl（640px・Tablet/Phone 100%）、
  FV説明文 kP2VHVF0k maxWidth 520＋改行（Phone は4行）、EntryTitle SgJ0coVxH に Params JSON(Hxba1_vhG)、EntryLab lqoo8Muzt に Poster(vq1Y9e63J)、
  Lede x18RxENQD Desktop 14px/1.7/0.02em/maxWidth1245（Tablet/Phone 16px/1.85/680）、onm7Q3akY・P3tnExolP padding 0 115 0 0、wVCo5rUp6 padding 0、
  headStart＝背景 #F4F4F1・エディタバー非表示・Geist Mono preload。CMS Poster 197件を ?v=r7 で再アップロード。
- 公開後の点検：hydration エラー0（home / page-turn / scratch-card / speed-dial）、カード→詳細は文書を切り替えずに遷移、SP 横はみ出し0。
- デモの絵＝紙と活字・モノクロ18枚（r7、GH Pages）。一覧の下地 LQIP は MotionDictionaryV2 の定数＝ポスターを撮り直したら再生成（毎朝の新項目は下地なしで表示）。

## 状態
- 本番（https://motion-dict.framer.website・Framer PnTJSNS3Yi1gInF6kBFb）は **無変更**。
- 作業は Framer の **複製プロジェクト** `4FmgcacdTtjanKiZQCuP`（プレビュー https://glorious-sandwich-453593.framer.app ・noindex）と、
  git の **v2 ブランチ**（worktree = ~/projects/motion-dict-v2）。Framerのブランチ機能はこのプランでは使えなかった。
- GH Pages へは **追加のみ** push 済み（/stage/<slug>/・public/entry/*.json・entries-v2.json・録画v2スクリプト）。
  旧 /demo/・entries.json・videos/・posters/ は触っていない。

## ✅（済 2026-10-24 22時台）翌朝7:30の毎朝ルーティンの前の片付け
- ~/projects/motion-dict（main の作業ディレクトリ）に録画台本づくり用の未追跡ファイルが残っている：
  rec/、scripts/record-v2.cjs、scripts/poster-pick.py、scripts/rec-qa.py（.git/info/exclude で隠している）。
  ルーティンは `git pull` → `git add -A` するので、**pull が「未追跡ファイルが上書きされる」で止まる**。
  → rec/ を v2 に移し、3スクリプトを削除し、.git/info/exclude の4行を消し、`git pull` しておく。

## 独立レビュー（3レンズ・毎回経緯を渡さない別エージェント）
| 回 | 動き | UX | ビジュアル |
|---|---|---|---|
| 1（現行本番） | 4.0 | 5.5 | 5.5 |
| 2 | 5.5 | 7.0 | 5.5 |
| 3 | 5.5 | 6.5 | 6.0 |
| 4 | 6.0 | 7.0 | 6.0 |
→ 4回目で「サイトの作りで直る点」はほぼ出尽くし。残りはRyotaの判断（下）。

## Ryotaの判断待ち（作りでは上がらない）
1. **本番へ移すか**（下の「本番移行の手順」）。移すまで本番は無変更。
2. **デモの絵柄**：195本とも黒地×ライム×等幅英字の仮置き（Hover me / Page A / 山のイラスト）。写真系（ken-burns・duotone 等）は実写が要る。カテゴリで地色を変える等の方針。
3. **和文フォントの重さ**：Noto Sans JP 3ウェイト×約2.2MB＝1ページ約10MBのうち6.7MB。Framerではサブセット不可→ウェイトを絞る or 本文をシステム書体に。
4. **Framer有料プラン＋独自ドメイン**：Made in Framer バッジ、検索流入。サイト設定の「既定言語」が English（html lang が空）→ 日本語に（UIでしか変えられない）。
5. 辞典としての「署名」（全項目共通のイージング曲線図など）を持つか。

## 本番移行の手順（承認後）
1. Framer本番（PnTJSNS3Yi1gInF6kBFb）に framer/*.tsx の7本をコードファイルとして入れる（upsert-code.js）
2. CMS：Prompt Raw / Params JSON フィールド追加＋値（cms-upsert.js：欠落3項目の追加・NG/OKの「」二重も直る）・Poster を v2 ポスターに（og-posters.js）
3. 詳細ページ・一覧のキャンバス変更（detail-1.js / detail-2.js / round2.js / round3.js / home-1.js と、ヘッダーのリンク・h2・phone/tablet の余白）※IDは本番と複製で同じ（remix）＝そのまま流せる見込み。流す前に serialize で確認
4. publish → 公開URLで実測
5. 毎朝パイプライン：v2 ブランチの commit 85afcb8（sync-to-framer / framer-upsert-one の v2 対応）を main へ

## 2026-10-25 プロンプトの盲検と補修（本番反映済）
- 盲検：プロンプトだけを別のAI（Opus 5.5）に渡して単体HTMLを作らせ、同じ録画台本で撮って独立レビュアーが比較。層別ランダム10件
  - 補修前：同じ動き5／半分5／別物0 → 補修後（同じ10件・別のレビュアー）：同じ9／半分1／別物0、指示破り0
- 補修：全196件の先頭に「- きっかけ: 」（validate-content が必須化）／値・イージング・単位をデモ実物に合わせた／border-draw は1辺1要素に／gradient-morph はデモがクリックで再現していると注記
- デモ修正：cover-transition の差し替えちらつき（flushSync）、page-turn の自走とクリックの二重送り（直近の実操作で自走を待たせる）。2本を撮り直し
- 反映：main push（GH Pages）→ Framer CMS（本番196・複製195）の Prompt Raw/Template/Params/Vocab/NG/OK を一括更新 → 本番 publish。公開URLで「きっかけ」行を確認
- 一括更新スクリプト：/tmp/md-bulk-update.cjs（消える。必要なら scripts/ に移す）
- 方針：デモの「展示用の自動再生」はプロンプトに書かない。サイトでも要る自動再生（表示時に1回など）だけ書く
