const P = { pagePath: "/entries/:Entries" };
const dsl = `
/** セクション見出し：EntryLab/EntryNav と同じ書式（Geist Mono・番号は灰） */
DEL GWbD9BZgr;
DEL cs5oTh73A;
SET mMj9AV49R fontName="Geist Mono" fontWeight="400" fontSize="12px" letterSpacing="0.08em" textTransform="uppercase";
SET v:mMj9AV49R:0:0 text="03  Vocab  ";
+TextRun vocabJa parent="v:mMj9AV49R:0" text="この動きを構成する語彙" textColor="rgb(107, 107, 102)";
SET Wmv5smCch fontName="Geist Mono" fontWeight="400" fontSize="12px" letterSpacing="0.08em" textTransform="uppercase";
SET v:Wmv5smCch:0:0 text="04  NG → OK  ";
+TextRun ngokJa parent="v:Wmv5smCch:0" text="伝え方の差分" textColor="rgb(107, 107, 102)";
SET P3tnExolP gap="20px";
SET wVCo5rUp6 gap="20px";

/** NG/OK：枠の作りを揃える（どちらも全周1px。OKは墨の枠で正解を示す） */
SET Ol03LUK5Q border="1px solid rgba(10,10,10,0.16)" padding="24px" radius="10px" height="auto";
SET bi4yu51sB borderLeft="null" border="1px solid #0A0A0A" padding="24px" radius="10px" height="auto";
SET qYzPaX8KI gap="16px";

/** フッター（制作者への導線） */
+FrameNode dFootRule name="Rule" parent="KMqYPvAxV" fill="#0A0A0A" layout="null" position="relative" width="100%" height="1px";
+FrameNode dFoot name="Footer" parent="KMqYPvAxV" layout="stack" stackDirection="horizontal" stackDistribution="space-between" stackAlignment="center" padding="32px 40px 40px 40px" position="relative" width="100%" height="auto";
+RichTextNode dFootL parent="dFoot" text="動きの伝え方辞典 — UIモーションの名前と、AIに渡す言葉の対訳" fontName="Noto Sans JP" fontWeight="500" fontSize="13px" lineHeight="1.6em" textColor="rgb(107, 107, 102)";
+RichTextNode dFootR parent="dFoot" text="制作の相談は monaka design. →" fontName="Geist Mono" fontWeight="500" fontSize="13px" letterSpacing="0.04em" lineHeight="1.6em" textColor="rgb(10, 10, 10)" link.href="https://monakadesign.com" link.openInNewTab="true";
`;
const r = await framer.agent.applyChanges(dsl, P);
console.log(JSON.stringify(r).slice(0, 2000));
