// Publishes what's on the test build (/dev/, the tip of main on GitHub) as the public game.
//
// It creates a GitHub Release tagged v<year>.<month>.<day> (plus .2, .3... for more the same day)
// whose notes list the commits since the last release, then pushes an empty "Release <tag>" commit
// to main. That push runs the deploy, which puts the release at https://esalavat.github.io/shop-game/
// (Pages skips a deploy for a commit it has already deployed, and main's tip usually has been;
// docs/TECH.md §9.1). Your local main is then one commit behind: git pull.
//
// Usage: npm run release [-- --yes] [-- <commit>]

import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const args = process.argv.slice(2);
const yes = args.includes('--yes');
const target = args.find((a) => !a.startsWith('--')) ?? 'origin/main';

const run = (cmd, ...a) => execFileSync(cmd, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryRun = (cmd, ...a) => { try { return run(cmd, ...a); } catch { return ''; } };
const saveVersion = (ref) => Number(/STATE_VERSION = (\d+)/.exec(tryRun('git', 'show', `${ref}:js/sim/state.js`))?.[1]);

run('git', 'fetch', '--tags', '--quiet', 'origin');
const sha = run('git', 'rev-parse', `${target}^{commit}`);
try { run('git', 'merge-base', '--is-ancestor', sha, 'origin/main'); } catch {
  console.error(`${target} isn't on main on GitHub. Push it first, so it's been on the test build.`);
  process.exit(1);
}

const last = tryRun('gh', 'release', 'view', '--json', 'tagName', '--jq', '.tagName');
// Same files as the last release (e.g. only its "Release" marker commit since): nothing new.
if (last && run('git', 'rev-parse', `${last}^{tree}`) === run('git', 'rev-parse', `${sha}^{tree}`)) {
  console.log(`Nothing new since ${last}.`);
  process.exit(0);
}

const now = new Date();
const base = `v${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
const tags = new Set(run('git', 'tag', '--list', `${base}*`).split('\n').filter(Boolean));
let tag = base;
for (let n = 2; tags.has(tag); n++) tag = `${base}.${n}`;

const changes = run('git', 'log', '--format=- %s', ...(last ? [`${last}..${sha}`] : ['-15', sha]))
  .split('\n').filter((l) => !/^- Release v[\d.]+$/.test(l)).join('\n');
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

// A fresh commit on main, made without touching your working tree, so the deploy can't be skipped.
run('git', 'fetch', '--quiet', 'origin', 'main');
const tip = run('git', 'rev-parse', 'origin/main');
const marker = run('git', 'commit-tree', `${tip}^{tree}`, '-p', tip, '-m', `Release ${tag}`);
run('git', 'push', '--quiet', 'origin', `${marker}:refs/heads/main`);

console.log(`\nReleased: ${url}\nPushed "Release ${tag}" to main; its deploy publishes the release in about a minute (gh run watch).`);
console.log('Run git pull to bring your local main up to date.');
