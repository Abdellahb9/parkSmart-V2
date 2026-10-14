#!/usr/bin/env node
// Generates the web and mobile theme files from design/tokens/*.json.
//
//   node design/build-tokens.mjs            write the generated files
//   node design/build-tokens.mjs --check    fail if they are stale (CI)
//
// Deliberately dependency-free: it must run anywhere Node runs, Windows
// included, without adding a toolchain to either app.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CHECK = process.argv.includes('--check');

const read = (f) => JSON.parse(readFileSync(join(HERE, 'tokens', f), 'utf8'));
const primitives = read('primitives.json');
const semantic = read('semantic.json');
const domain = read('domain.json');
const scales = read('scales.json');

// ---- helpers -------------------------------------------------------------
const fail = (msg) => {
  console.error('token build failed: ' + msg);
  process.exit(1);
};

// "{navy.800}" -> "#0F2A4A"; a literal hex passes through.
const resolveRef = (value, where) => {
  if (typeof value !== 'string') fail(where + ': expected a string');
  const m = value.match(/^\{([^}]+)\}$/);
  if (!m) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) fail(where + ': "' + value + '" is neither a {ref} nor a 6-digit hex');
    return value.toUpperCase();
  }
  const hit = m[1].split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), primitives);
  if (typeof hit !== 'string') fail(where + ': unresolved reference {' + m[1] + '}');
  if (!/^#[0-9A-Fa-f]{6}$/.test(hit)) fail(where + ': {' + m[1] + '} resolved to "' + hit + '", not a hex');
  return hit.toUpperCase();
};

const colorEntries = Object.entries({ ...semantic, ...domain }).filter(([k]) => !k.startsWith('_'));
const light = colorEntries.map(([k, v]) => [k, resolveRef(v.light, k + '.light')]);
const dark = colorEntries.map(([k, v]) => [k, resolveRef(v.dark, k + '.dark')]);

const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
// Dart identifiers cannot start with a digit: "2xl" -> "xl2".
const dartIdent = (s) => (/^\d/.test(s) ? s.replace(/^(\d+)(.*)$/, (_, d, rest) => (rest || 'n') + d) : camel(s));
const px = (v) => {
  const n = Number(String(v).replace('px', ''));
  if (Number.isNaN(n)) fail('"' + v + '" is not a px value');
  return n;
};
const banner = (open) =>
  open + ' GENERATED FILE — do not edit by hand.\n' +
  open + ' Source: design/tokens/*.json   Regenerate: node design/build-tokens.mjs\n';

// ---- web: Tailwind 4 theme ----------------------------------------------
const cssColors = (pairs, indent) => pairs.map(([k, v]) => indent + '--color-' + k + ': ' + v + ';').join('\n');
const cssShadows = (theme, indent) =>
  Object.entries(scales.elevation).map(([k, v]) => indent + '--shadow-' + k + ': ' + v[theme] + ';').join('\n');
const list = (obj, fn) => Object.entries(obj).map(fn).join('\n');

const cssBanner =
  '/* GENERATED FILE — do not edit by hand.\n' +
  '   Source: design/tokens/*.json   Regenerate: node design/build-tokens.mjs */\n';

const css = cssBanner +
`@theme {
  /* Color (light) */
${cssColors(light, '  ')}

  /* Spacing: 4px base, so p-4 = 16px */
  --spacing: 4px;

  /* Radius */
${list(scales.radius, ([k, v]) => '  --radius-' + k + ': ' + v + ';')}

  /* Type */
${list(scales.text, ([k, v]) => '  --text-' + k + ': ' + v + ';')}
${list(scales.weight, ([k, v]) => '  --font-weight-' + k + ': ' + v + ';')}
${list(scales.leading, ([k, v]) => '  --leading-' + k + ': ' + v + ';')}
${list(scales.font, ([k, v]) => '  --font-' + k + ': ' + v + ';')}

  /* Elevation (light) */
${cssShadows('light', '  ')}
}

/* Raw spacing scale, for hand-written CSS that is not a Tailwind utility. */
:root {
${list(scales.space, ([k, v]) => '  --ap-space-' + k + ': ' + v + ';')}
  color-scheme: light;
}

/* Dark theme. Tailwind utilities read these same custom properties, so
   overriding them here re-themes every utility with no component changes. */
:root[data-theme="dark"] {
  color-scheme: dark;
${cssColors(dark, '  ')}
${cssShadows('dark', '  ')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${cssColors(dark, '    ')}
${cssShadows('dark', '    ')}
  }
}
`;

// ---- mobile: Dart tokens -------------------------------------------------
const dartColor = (hex) => 'Color(0xFF' + hex.slice(1) + ')';
const fields = light.map(([k]) => dartIdent(k));
const dartInstance = (name, pairs) =>
  'const ApColors ' + name + ' = ApColors(\n' +
  pairs.map(([k, v]) => '  ' + dartIdent(k) + ': ' + dartColor(v) + ',').join('\n') +
  '\n);';

const dart = banner('//') + `
import 'dart:ui' show Color, FontWeight;

/// Every semantic and domain colour, for one theme.
class ApColors {
${fields.map((f) => '  final Color ' + f + ';').join('\n')}

  const ApColors({
${fields.map((f) => '    required this.' + f + ',').join('\n')}
  });
}

${dartInstance('apLight', light)}

${dartInstance('apDark', dark)}

/// Spacing scale (4px base).
class ApSpace {
  const ApSpace._();
${list(scales.space, ([k, v]) => '  static const double s' + k + ' = ' + px(v).toFixed(1) + ';')}
}

/// Corner radii.
class ApRadius {
  const ApRadius._();
${list(scales.radius, ([k, v]) => '  static const double ' + dartIdent(k) + ' = ' + px(v).toFixed(1) + ';')}
}

/// Font sizes, in logical pixels.
class ApText {
  const ApText._();
${list(scales.text, ([k, v]) => '  static const double ' + dartIdent(k) + ' = ' + px(v).toFixed(1) + ';')}
}

/// Font weights.
class ApWeight {
  const ApWeight._();
${list(scales.weight, ([k, v]) => '  static const FontWeight ' + dartIdent(k) + ' = FontWeight.w' + v + ';')}
}

/// Line heights, as multipliers.
class ApLeading {
  const ApLeading._();
${list(scales.leading, ([k, v]) => '  static const double ' + dartIdent(k) + ' = ' + Number(v).toFixed(2) + ';')}
}
`;

// ---- docs ----------------------------------------------------------------
const md = `# Design tokens

<!-- GENERATED from design/tokens/*.json — run \`node design/build-tokens.mjs\`. -->

Edit the JSON in \`design/tokens/\`, regenerate, and both apps move together.
Never edit the generated files:

- \`autopark/web/src/styles/theme.css\`
- \`autopark/mobile/lib/design/app_tokens.g.dart\`

## Colour

| Token | Light | Dark |
|---|---|---|
${light.map(([k, v], i) => '| `' + k + '` | `' + v + '` | `' + dark[i][1] + '` |').join('\n')}

## Scales

| Scale | Values |
|---|---|
| space | ${Object.entries(scales.space).map(([k, v]) => k + '=' + v).join(', ')} |
| radius | ${Object.entries(scales.radius).map(([k, v]) => k + '=' + v).join(', ')} |
| text | ${Object.entries(scales.text).map(([k, v]) => k + '=' + v).join(', ')} |
| weight | ${Object.entries(scales.weight).map(([k, v]) => k + '=' + v).join(', ')} |
| leading | ${Object.entries(scales.leading).map(([k, v]) => k + '=' + v).join(', ')} |
`;

// ---- write / check -------------------------------------------------------
const targets = [
  [join(ROOT, 'autopark/web/src/styles/theme.css'), css],
  [join(ROOT, 'autopark/mobile/lib/design/app_tokens.g.dart'), dart],
  [join(ROOT, 'docs/design-tokens.md'), md],
];

let stale = 0;
for (const [file, content] of targets) {
  let current = null;
  try {
    current = readFileSync(file, 'utf8');
  } catch {
    current = null;
  }
  const same = current === content;
  if (CHECK) {
    if (same) console.log('ok     ' + file);
    else {
      console.error('STALE  ' + file);
      stale++;
    }
    continue;
  }
  if (same) {
    console.log('unchanged  ' + file);
    continue;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log('wrote      ' + file);
}

if (CHECK && stale) {
  console.error('\n' + stale + ' generated file(s) are stale — run: node design/build-tokens.mjs');
  process.exit(1);
}
console.log(CHECK ? '\nall generated files are up to date' : '\n' + colorEntries.length + ' colours x 2 themes generated');
