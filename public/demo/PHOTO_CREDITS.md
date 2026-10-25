# デモ用の写真（public/demo/photo-01〜18.jpg）

2026-10-25 r7 で総入れ替え。題材は「紙と活字」（紙・本・活字・タイプライター・刷り物・製図）に統一し、全部を粒子のあるモノクロにそろえた。
旧版（photo-01〜08：フィヨルド・山・コーヒー等の汎用写真）は使い回しが多く世界観が無い、と独立レビューで減点されたため。

## ライセンス
Unsplash License（商用可・クレジット不要）。Lorem Picsum 経由で原寸を取得（picsum は Unsplash の写真だけを配っている。id → Unsplash の写真ページは下表）。

## 処理（scripts/photos-paper.py で再現できる）
- 1600×1000（16:10）に切り出し
- 輝度だけを使う（R=G=B）。色は一切残さない＝写真に色を付けない（ライムは印だけ）
- 0.4% / 99.6% で黒と白を拾い直し、黒の底 #0E0E0E・紙の白の天井 #EBEBEB（無彩色。生成り #F4F4F1 に寄せない）
- ゆるいS字（肩と足だけ締める）
- 細かい粒子：σ6.5 の輝度ノイズを 0.55px 馴染ませ、中間調に強く・端で弱く乗せる（写真ごとに乱数固定）
- JPEG q80 / progressive

## 一覧

| ファイル | 題材 | 撮影者 | Unsplash | picsum id |
|---|---|---|---|---|
| photo-01.jpg | 本のページを壁一面に貼った面 | Patrick Tomasso | https://unsplash.com/photos/Oaqk7qqNh_c | 1073 |
| photo-02.jpg | 開いた本 | Alejandro Escamilla | https://unsplash.com/photos/cZhUxIQjILg | 24 |
| photo-03.jpg | タイプライターの活字キー | Sergey Zolkin | https://unsplash.com/photos/E0Spm6XXn2Y | 403 |
| photo-04.jpg | 木活字のアンパサンドと刷り物 | Jeff Sheldon | https://unsplash.com/photos/9SyOKYrq-rE | 526 |
| photo-05.jpg | 螺旋の書架 | Patrik Göthe | https://unsplash.com/photos/xiTFENI0dMY | 444 |
| photo-06.jpg | 紙を噛ませたタイプライター | Florian Klauer | https://unsplash.com/photos/mk7D-4UCfmg | 486 |
| photo-07.jpg | 分解したタイプライターの部品 | Florian Klauer | https://unsplash.com/photos/-K6JMRMj4x4 | 252 |
| photo-08.jpg | 紐で束ねた紙束とペン・インク壺 | Joanna Kosinska | https://unsplash.com/photos/B6yDtYs2IgY | 998 |
| photo-09.jpg | 開いた冊子 | Noe Araujo | https://unsplash.com/photos/ChY016PARQY | 464 |
| photo-10.jpg | タイプライターとノートの卓上 | Dustin Lee | https://unsplash.com/photos/jLwVAUtLOAQ | 885 |
| photo-11.jpg | 並べた鉛筆と刷りの看板 | Jeff Sheldon | https://unsplash.com/photos/guH91yuPaMk | 533 |
| photo-12.jpg | 定規とノート | Jeff Sheldon | https://unsplash.com/photos/JWiMShWiF14 | 534 |
| photo-13.jpg | 製図用紙と分度器 | Sergey Zolkin | https://unsplash.com/photos/m9qMoh-scfE | 802 |
| photo-14.jpg | 本を読む人 | hieu le | https://unsplash.com/photos/SrkuyPb3aUk | 832 |
| photo-15.jpg | 雑誌を開く手（真上から） | Bino Storyteller | https://unsplash.com/photos/lZlfHGqx44Q | 882 |
| photo-16.jpg | 活版刷りの表紙のノート | Jeff Sheldon | https://unsplash.com/photos/o6Y9E-DdG6w | 528 |
| photo-17.jpg | 製図用コンパス | Jeff Sheldon | https://unsplash.com/photos/8z2Q6XWLYa4 | 527 |
| photo-18.jpg | ノートに書く手 | Alejandro Escamilla | https://unsplash.com/photos/y83Je1OC6Wc | 4 |
