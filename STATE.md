# motion-dict v2 ブラッシュアップ（2026-10-24〜）— 再開はここから

## 状態
- 本番（https://motion-dict.framer.website・Framer PnTJSNS3Yi1gInF6kBFb）は **無変更**。
- 作業は Framer の **複製プロジェクト** `4FmgcacdTtjanKiZQCuP`（プレビュー https://glorious-sandwich-453593.framer.app ・noindex）と、
  git の **v2 ブランチ**（worktree = ~/projects/motion-dict-v2）。Framerのブランチ機能はこのプランでは使えなかった。
- GH Pages へは **追加のみ** push 済み（/stage/<slug>/・public/entry/*.json・entries-v2.json・録画v2スクリプト）。
  旧 /demo/・entries.json・videos/・posters/ は触っていない。

## 🔴 翌朝7:30の毎朝ルーティン（anime-demo）の前に必ずやること
- ~/projects/motion-dict（main の作業ディレクトリ）に録画台本づくり用の未追跡ファイルが残っている：
  rec/、scripts/record-v2.cjs、scripts/poster-pick.py、scripts/rec-qa.py（.git/info/exclude で隠している）。
  ルーティンは `git pull` → `git add -A` するので、**pull が「未追跡ファイルが上書きされる」で止まる**。
  → rec/ を v2 に移し、3スクリプトを削除し、.git/info/exclude の4行を消し、`git pull` しておく。

## 残り
1. 録画台本（rec/*.json・5エージェント並列）→ v2 で最終録画（public/v2/videos・posters）→ push
2. 複製Framerで一覧・詳細を独立レビュー → 直す、を基準到達まで
3. Ryota承認後に本番へ移植：コードファイル4本（EntryLab/EntryNav/EntryTitle/MotionDictionaryV2）・CMSフィールド2本＋値・
   詳細ページ/一覧のDSL（/tmp/md-framer/detail-*.js・home-1.js と同じ内容）・欠落3項目のCMS追加・publish
4. 毎朝パイプラインの切替：record-one.cjs → record-v2.cjs（台本が無い日は既定動作）、CMS upsert に Prompt Raw/Params JSON を追加、
   sync の NG/OK の「」二重を直す（scripts/export-entries-json と同じ q() ）
