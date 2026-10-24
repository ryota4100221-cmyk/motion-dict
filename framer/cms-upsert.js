const fs = require('fs');
const rows = JSON.parse(fs.readFileSync('/tmp/md-cms.json', 'utf8'));
const c = (await framer.getCollections()).find(c => c.id === 'UQDoIUPil');
const fields = await c.getFields();
const F = Object.fromEntries(fields.map(f => [f.name, f]));
const items = await c.getItems();
const bySlug = Object.fromEntries(items.map(i => [i.slug, i]));
const cat = F['Category'];
const caseId = (k) => (cat.cases.find(x => x.name === k || x.id === k) || cat.cases[0]).id;
const GH = 'https://ryota4100221-cmyk.github.io/motion-dict';
const md = (v) => ({ type: 'formattedText', value: v, contentType: 'markdown' });
const s = (v) => ({ type: 'string', value: v });
const out = [];
for (const r of rows) {
  const ex = bySlug[r.slug];
  const fd = {
    [F['Prompt Raw'].id]: s(r.promptRaw),
    [F['Params JSON'].id]: s(r.paramsJson),
    [F['NG Example'].id]: md(r.ng),
    [F['OK Example'].id]: md(r.ok),
  };
  if (!ex) Object.assign(fd, {
    [F['Name JA'].id]: s(r.nameJa), [F['Name EN'].id]: s(r.nameEn), [F['Lede'].id]: s(r.lede),
    [F['Category'].id]: { type: 'enum', value: caseId(r.category) },
    [F['Prompt Template'].id]: md(r.promptTemplate), [F['Params'].id]: md(r.params), [F['Vocab'].id]: md(r.vocab),
    [F['Live Demo URL'].id]: { type: 'link', value: `${GH}/demo/${r.slug}` },
  });
  out.push(ex ? { id: ex.id, fieldData: fd } : { slug: r.slug, fieldData: fd });
}
for (let i = 0; i < out.length; i += 25) await c.addItems(out.slice(i, i + 25));
const after = await c.getItems();
console.log('items', after.length, 'new', out.filter(o => !o.id).map(o => o.slug));
const sample = after.find(i => i.slug === 'magnetic-hover');
console.log(JSON.stringify(sample.fieldData[F['Prompt Raw'].id]).slice(0, 120), JSON.stringify(sample.fieldData[F['NG Example'].id]).slice(0, 160));
