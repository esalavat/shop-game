// Builds the published site into an output folder with every module URL version-stamped.
//
// Phones cache each file separately, so after a deploy a phone can mix a new index.html with
// old cached modules and fail to start. This writes an import map that points every module
// (including relative imports between them) at `file.js?v=<version>`, so one deploy's files
// always load together. The source stays plain and needs no build to run locally.
//
// It also writes the channel and version into <html data-channel data-version> (js/core/channel.js).
// The 'dev' channel is the test build at /dev/: its home-screen app gets its own name.
//
// Usage: node scripts/stamp.js <outDir> [version] [channel]
//   version defaults to $GITHUB_SHA or a timestamp; channel is 'main' (default) or 'dev'.

import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const outDir = process.argv[2] ?? '_site';
const version = (process.argv[3] || process.env.GITHUB_SHA || Date.now().toString(36)).slice(0, 10);
const channel = process.argv[4] ?? 'main';
const PUBLISH = ['index.html', 'visit.html', 'style.css', 'manifest.webmanifest', 'icon.svg', 'icons', 'sw.js', 'js', 'vendor', 'prototypes'];
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

// The game and the visit page (GDD #91) share the import map and stamps.
const map = `<script type="importmap">\n${JSON.stringify({ imports }, null, 1)}\n</script>`;
for (const page of ['index.html', 'visit.html']) {
  const pagePath = join(outDir, page);
  let html = readFileSync(pagePath, 'utf8');
  html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, map);
  html = html.replace(/(src="js\/(?:main|visit)\.js)\?v=[^"]*"/, `$1?v=${version}"`);
  html = html.replace(/(href="style\.css)\?v=[^"]*"/, `$1?v=${version}"`);
  html = html.replace(/<html lang="en">/, `<html lang="en" data-channel="${channel}" data-version="${version}">`);
  if (channel !== 'main') html = html.replace(/<title>(.*?)<\/title>/, `<title>$1 (${channel.toUpperCase()})</title>`);
  writeFileSync(pagePath, html);
}

if (channel !== 'main') {
  const manifestPath = join(outDir, 'manifest.webmanifest');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.name += ` (${channel.toUpperCase()})`;
  manifest.short_name += ` ${channel.toUpperCase()}`;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

console.log(`Stamped ${Object.keys(imports).length} modules with v=${version} (${channel}) into ${outDir}/`);
