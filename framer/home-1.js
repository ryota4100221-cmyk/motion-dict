const P = { pagePath: "/" };
const dsl = `
+ComponentInstanceNode hList component="codeFile/St5XWTm:default" parent="WQLkyLRf1" index="6" $control__dataURL="https://ryota4100221-cmyk.github.io/motion-dict/entries-v2.json" $control__stickyTop="0" position="relative" width="100%" height="auto";
DEL teWgHItUv;
DEL f2GRxFSoc;
SET v:jCG_TzbUJ:0 tag="h1";
`;
const r = await framer.agent.applyChanges(dsl, P);
console.log(JSON.stringify(r).slice(0, 1500));
const s = await framer.agent.serialize({ id: "tzDXFJy9j", depth: 3 }, P);
console.log(JSON.stringify(s).slice(0, 1800));
const bp = await framer.agent.serialize({ id: "augiA20Il", depth: 1, attributeFilter: ["name"] }, P);
console.log(JSON.stringify(bp.$breakpoints), bp.children.map(c=>c.id+':'+c.name).join(' '));
