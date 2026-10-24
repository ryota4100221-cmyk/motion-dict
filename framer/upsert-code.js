const fs = require('fs');
const names = ["EntryLab.tsx", "EntryNav.tsx", "MotionDictionaryV2.tsx", "EntryTitle.tsx"];
const existing = await framer.getCodeFiles();
const out = {};
for (const n of names) {
  const code = fs.readFileSync('/tmp/md-framer/' + n, 'utf8');
  let f = existing.find(x => x.name === n);
  f = f ? await f.setFileContent(code) : await framer.createCodeFile(n, code);
  const diags = await f.typecheck().catch(e => [{ message: String(e) }]);
  out[n] = { id: f.id, exports: f.exports.map(e => ({ name: e.name, type: e.type, id: e.insertURL || e.componentId || e.id })), errors: diags.filter(d => d.category === 1).map(d => d.message || JSON.stringify(d)).slice(0, 8) };
}
state.code = out;
console.log(JSON.stringify(out, null, 1));
