// Builds the published site into an output folder with every module URL version-stamped.
//
// Phones cache each file separately, so after a deploy a phone can mix a new index.html with
// old cached modules and fail to start. This writes an import map that points every module
// (including relative imports between them) at `file.js?v=<version>`, so one deploy's files
// always load together. The source stays plain and needs no build to run locally.
//
// Usage: node scripts/stamp.js <outDir> [version]   (version defaults to $GITHUB_SHA or a timestamp)

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const outDir = process.argv[2] ?? '_site';
const version = (process.argv[3] ?? process.env.GITHUB_SHA ?? Date.now().toString(36)).slice(0, 10);
const PUBLISH = ['index.html', 'style.css', 'manifest.webmanifest', 'icon.svg', 'icons', 'sw.js', 'js', 'vendor', 'prototypes'];
const MODULE_DIRS = ['js', 'vendor'];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const p of PUBLISH) cpSync(p, join(outDir, p), { recursive: true });

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.js')) yield p;
  }
}

const v = (path) => `./${path}?v=${version}`;
const imports = {
  three: v('vendor/three.module.js'),
  'three/addons/effects/OutlineEffect.js': v('vendor/addons/effects/OutlineEffect.js'),
};
for (const dir of MODULE_DIRS) {
  for (const file of walk(dir)) {
    const path = relative('.', file).split('\\').join('/');
    imports[`./${path}`] = v(path);
  }
}

const indexPath = join(outDir, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const map = `<script type="importmap">\n${JSON.stringify({ imports }, null, 1)}\n</script>`;
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, map);
html = html.replace(/(src="js\/main\.js)\?v=[^"]*"/, `$1?v=${version}"`);
html = html.replace(/(href="style\.css)\?v=[^"]*"/, `$1?v=${version}"`);
writeFileSync(indexPath, html);

console.log(`Stamped ${Object.keys(imports).length} modules with v=${version} into ${outDir}/`);
