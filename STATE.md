# motion-dict v2 ブラッシュアップ（2026-10-24〜）— 再開はここから

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
