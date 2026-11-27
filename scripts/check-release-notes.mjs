import { readFileSync } from 'node:fs';
import { analyzeCommits } from '@semantic-release/commit-analyzer';
import { generateNotes } from '@semantic-release/release-notes-generator';

const config = JSON.parse(readFileSync(new URL('../.releaserc.json', import.meta.url)));

const pluginConfig = (name) => {
  const entry = config.plugins.find((p) => (Array.isArray(p) ? p[0] : p) === name);
  return Array.isArray(entry) ? entry[1] : {};
};

const context = {
  cwd: process.cwd(),
  logger: { log() {} },
  commits: [],
  lastRelease: { gitTag: 'v0.0.0' },
  nextRelease: { gitTag: 'v0.1.0', version: '0.1.0' },
  options: { repositoryUrl: 'https://github.com/edgepiece/platform-templates.git' },
};

let failed = false;
const check = (ok, message) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${message}`);
  if (!ok) failed = true;
};

const analyze = (message) =>
  analyzeCommits(pluginConfig('@semantic-release/commit-analyzer'), {
    ...context,
    commits: [{ hash: 'abc1234', message }],
  });

check((await analyze('feat: add cart')) !== null, 'feat releases');
check((await analyze('fix: correct price')) !== null, 'fix releases');
check((await analyze('feat!: change catalogue format')) !== null, 'feat! releases');
check((await analyze('docs: update readme')) === null, 'docs does not release');

const notes = await generateNotes(pluginConfig('@semantic-release/release-notes-generator'), {
  ...context,
  commits: [
    { hash: 'aaa1111', message: 'feat: add cart', committerDate: '2026-01-01' },
    { hash: 'bbb2222', message: 'fix: correct price', committerDate: '2026-01-02' },
    { hash: 'ccc3333', message: 'docs: update readme', committerDate: '2026-01-03' },
  ],
});
check(notes.includes('add cart') && notes.includes('correct price'), 'notes list feat and fix');
check(!notes.includes('update readme'), 'notes omit docs');

process.exit(failed ? 1 : 0);
