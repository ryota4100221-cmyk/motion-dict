const P = { pagePath: "/entries/:Entries" };
const dsl = `
/** 共通ヘッダー（一覧と同じ） */
+FrameNode dTop name="Top bar" parent="KMqYPvAxV" index="0" layout="stack" stackDirection="horizontal" stackDistribution="space-between" stackAlignment="center" padding="22px 40px 22px 40px" position="relative" width="100%" height="auto";
+RichTextNode dHome parent="dTop" text="← Motion dictionary" fontName="Geist Mono" fontWeight="500" fontSize="13px" letterSpacing="0.08em" lineHeight="1.2em" textColor="rgb(10, 10, 10)" link.href="/";
+RichTextNode dBrand parent="dTop" text="monaka design." fontName="Geist Mono" fontWeight="500" fontSize="13px" letterSpacing="0.08em" lineHeight="1.2em" textColor="rgb(107, 107, 107)" link.href="https://monakadesign.com" link.openInNewTab="true";
+FrameNode dRule name="Rule" parent="KMqYPvAxV" index="1" fill="#0A0A0A" layout="null" position="relative" width="100%" height="1px";

/** 見出し：h1 を EntryTitle（括弧で見出し語と言い換えを分け、語の途中で折らない） */
+ComponentInstanceNode dTitle component="codeFile/m5BqRQp:default" parent="onm7Q3akY" index="1" $control__nameJA="var(--variable-ijeISC5zB)" $control__nameEN="var(--variable-FHv3UfcXb)" position="relative" width="100%" height="auto";
DEL i4h7GL1bk;
DEL A00c2uj3U;
SET x18RxENQD fontSize="16px" lineHeight="1.85em" textColor="rgb(51, 51, 51)" maxWidth="680px";
SET l3SYMs6TP padding="56px 32px 96px 32px" gap="72px" maxWidth="860px";

/** 旧：動画＋Play live／静的プロンプト／静的パラメータ → 触れるデモ＋スライダー＋連動プロンプト */
DEL YsnFaVbew;
DEL KHeRKVC6h;
DEL getq3poM6;
+ComponentInstanceNode dLab component="codeFile/A2wBF2H:default" parent="l3SYMs6TP" index="1" $control__template="var(--variable-vaAa66dT4)" $control__paramsJSON="var(--variable-hsa5ADAVF)" position="relative" width="100%" height="auto";

/** 末尾：関連・前後 */
+ComponentInstanceNode dNav component="codeFile/tUwofVa:default" parent="l3SYMs6TP" position="relative" width="100%" height="auto";
`;
const r = await framer.agent.applyChanges(dsl, P);
console.log(JSON.stringify(r).slice(0, 2000));
