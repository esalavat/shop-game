// Publishes what's on the test build (/dev/, the tip of main on GitHub) as the public game.
//
// It creates a GitHub Release tagged v<year>.<month>.<day> (plus .2, .3... for more the same day)
// whose notes list the commits since the last release. Publishing it runs the deploy workflow,
// which puts that release at https://esalavat.github.io/shop-game/ (docs/TECH.md §9.1).
//
// Usage: npm run release [-- --yes] [-- <commit>]

import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const args = process.argv.slice(2);
const yes = args.includes('--yes');
const target = args.find((a) => !a.startsWith('--')) ?? 'origin/main';

const run = (cmd, ...a) => execFileSync(cmd, a, { encoding: 'utf8' }).trim();
const tryRun = (cmd, ...a) => { try { return run(cmd, ...a); } catch { return ''; } };
const saveVersion = (ref) => Number(/STATE_VERSION = (\d+)/.exec(tryRun('git', 'show', `${ref}:js/sim/state.js`))?.[1]);

run('git', 'fetch', '--tags', '--quiet', 'origin');
const sha = run('git', 'rev-parse', `${target}^{commit}`);
try { run('git', 'merge-base', '--is-ancestor', sha, 'origin/main'); } catch {
  console.error(`${target} isn't on main on GitHub. Push it first, so it's been on the test build.`);
  process.exit(1);
}

const last = tryRun('gh', 'release', 'view', '--json', 'tagName', '--jq', '.tagName');
if (last && run('git', 'rev-parse', `${last}^{commit}`) === sha) {
  console.log(`${last} is already this commit; nothing to release.`);
  process.exit(0);
}

const now = new Date();
const base = `v${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
const tags = new Set(run('git', 'tag', '--list', `${base}*`).split('\n').filter(Boolean));
let tag = base;
for (let n = 2; tags.has(tag); n++) tag = `${base}.${n}`;

const changes = run('git', 'log', '--format=- %s', ...(last ? [`${last}..${sha}`] : ['-15', sha]));
console.log(`\nRelease ${tag} (${sha.slice(0, 7)}) to the public game.`);
console.log(last ? `Changes since ${last}:` : 'First release. Recent changes:');
console.log(changes.replace(/^/gm, '  '));

const before = last ? saveVersion(last) : NaN;
const after = saveVersion(sha);
if (before && after !== before) {
  console.log(`\n⚠️  The save version changes v${before} → v${after}. Players' saves upgrade the first time they open`);
  console.log('   this release. The upgrade can\'t be undone by rolling back: fix forward instead.');
}

if (!yes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('\nPublish? (y/N) ');
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) { console.log('Not released.'); process.exit(0); }
}

const notes = `${last ? `Changes since ${last}:` : 'Recent changes:'}\n\n${changes}`;
const url = run('gh', 'release', 'create', tag, '--target', sha, '--title', tag, '--latest', '--notes', notes);
console.log(`\nReleased: ${url}\nThe deploy runs now (gh run watch, or the Actions tab); the public game updates in about a minute.`);
