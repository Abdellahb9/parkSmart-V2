// Fails when fr.js and ar.js disagree: a key present in one language only, a
// plural missing a form its language needs, or placeholders that differ
// ({{n}} in French but not in Arabic means a number silently disappears).
//
//   npm run i18n:check
import fr from '../src/i18n/fr.js';
import ar from '../src/i18n/ar.js';

const PLURAL = /_(zero|one|two|few|many|other)$/;
const REQUIRED_FORMS = { fr: ['one', 'many', 'other'], ar: ['zero', 'one', 'two', 'few', 'many', 'other'] };

const flatten = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) out[key] = v;
    else if (v && typeof v === 'object') flatten(v, key, out);
    else out[key] = v;
  }
  return out;
};

const placeholders = (s) => (typeof s === 'string' ? [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort() : []);

const analyse = (code, dict) => {
  const flat = flatten(dict);
  const bases = new Map(); // base key -> { forms:Set, values }
  for (const [key, value] of Object.entries(flat)) {
    const m = PLURAL.exec(key);
    const base = m ? key.slice(0, m.index) : key;
    if (!bases.has(base)) bases.set(base, { plural: !!m, forms: new Set(), value: null, other: null });
    const entry = bases.get(base);
    if (m) {
      entry.forms.add(m[1]);
      if (m[1] === 'other') entry.other = value;
    } else entry.value = value;
  }
  return bases;
};

const frKeys = analyse('fr', fr);
const arKeys = analyse('ar', ar);
const problems = [];

for (const [base, entry] of frKeys) {
  if (!arKeys.has(base)) problems.push(`missing in ar: ${base}`);
}
for (const [base] of arKeys) {
  if (!frKeys.has(base)) problems.push(`missing in fr: ${base}`);
}

for (const [code, keys] of [['fr', frKeys], ['ar', arKeys]]) {
  for (const [base, entry] of keys) {
    if (!entry.plural) continue;
    for (const form of REQUIRED_FORMS[code]) {
      if (!entry.forms.has(form)) problems.push(`${code}: plural ${base} lacks _${form}`);
    }
  }
}

for (const [base, f] of frKeys) {
  const a = arKeys.get(base);
  if (!a) continue;
  // Compare the general forms: Arabic _one/_two legitimately spell the number out.
  const fv = f.plural ? f.other : f.value;
  const av = a.plural ? a.other : a.value;
  if (Array.isArray(fv) || Array.isArray(av)) {
    if (!Array.isArray(fv) || !Array.isArray(av) || fv.length !== av.length) {
      problems.push(`array length differs: ${base}`);
    }
    continue;
  }
  const fp = placeholders(fv).join(',');
  const ap = placeholders(av).join(',');
  if (fp !== ap) problems.push(`placeholders differ for ${base}: fr {${fp}} vs ar {${ap}}`);
}

if (problems.length) {
  console.error(`i18n check failed (${problems.length}):\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`i18n OK — ${frKeys.size} keys, French and Arabic in sync.`);
