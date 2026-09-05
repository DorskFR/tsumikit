import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalizeWorkingDir, workingDirCandidates } from '../src/lib/working-dir.ts';

test('absolute path: full, ancestors abbreviated left to right, leaf, truncated leaf', () => {
	assert.deepEqual(workingDirCandidates('/home/dorsk/Documents/cctui', { minLeaf: 3 }), [
		'/home/dorsk/Documents/cctui',
		'/h/dorsk/Documents/cctui',
		'/h/d/Documents/cctui',
		'/h/d/D/cctui',
		'cctui',
		'cct…'
	]);
});

test('relative path keeps no leading slash', () => {
	assert.deepEqual(workingDirCandidates('src/lib/components', { minLeaf: 18 }), [
		'src/lib/components',
		's/lib/components',
		's/l/components',
		'components'
	]);
});

test('trailing slashes are ignored', () => {
	assert.deepEqual(workingDirCandidates('/a/b/', { minLeaf: 18 }), ['/a/b', 'b']);
	assert.equal(normalizeWorkingDir('/a/b///'), '/a/b');
});

test('single segment yields itself, then truncation keeping at least minLeaf visible chars', () => {
	assert.deepEqual(workingDirCandidates('workspace', { minLeaf: 6 }), [
		'workspace',
		'workspa…',
		'worksp…'
	]);
	assert.deepEqual(workingDirCandidates('/workspace', { minLeaf: 18 }), ['/workspace', 'workspace']);
});

test('root and empty paths collapse to /', () => {
	assert.deepEqual(workingDirCandidates('/'), ['/']);
	assert.deepEqual(workingDirCandidates(''), ['/']);
	assert.equal(normalizeWorkingDir(''), '/');
});

test('minLeaf defaults to 18 visible chars and candidates never repeat', () => {
	assert.deepEqual(workingDirCandidates('/x/y'), ['/x/y', 'y']);
	const leaf = 'a'.repeat(20);
	const out = workingDirCandidates(`/x/${leaf}`);
	assert.deepEqual(out, [`/x/${leaf}`, leaf, `${'a'.repeat(18)}…`]);
	assert.ok(out.every((c) => [...c].length > 18));
});

const component = await readFile(
	new URL('../src/lib/components/molecules/WorkingDir.svelte', import.meta.url),
	'utf8'
);
const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');

test('WorkingDir shows the full path when wide and always carries it in title', () => {
	assert.match(component, /const candidates = \$derived\(workingDirCandidates\(path, \{ minLeaf \}\)\)/);
	assert.match(component, /let avail = \$state\(Infinity\)/);
	assert.match(component, /if \(full\) return normalized/);
	assert.match(component, /title=\{title \?\? normalized\}/);
	assert.match(component, /new ResizeObserver\(measure\)/);
});

test('WorkingDir leads with a folder Icon, is a plain span unless copy is opted in', () => {
	assert.match(component, /icon = 'folder'/);
	assert.match(component, /<Icon name=\{icon\} \/>/);
	assert.match(component, /copy = false/);
	assert.match(component, /as=\{copy \? 'button' : 'span'\}/);
	assert.doesNotMatch(component, /:global/);
});

test('WorkingDir and its helper are exported from the package index', () => {
	assert.match(index, /export \{ default as WorkingDir \} from '\.\/components\/molecules\/WorkingDir\.svelte'/);
	assert.match(index, /workingDirCandidates/);
});

test('WorkingDir rail keeps its height inside a column flex parent', () => {
	assert.match(component, /\.rail\s*{[^}]*min-height: max-content;/s);
});

test('shrink caps the rail at the full path width so it sizes to content yet still truncates', () => {
	assert.match(component, /shrink = false/);
	assert.match(component, /shrink\?: boolean/);
	assert.match(component, /const fullWidth = \$derived\(shrink && !full \? Math\.ceil\(candidates\[0\]\.length \* chPx \+ chrome \+ 2\) : undefined\)/);
	assert.match(component, /style:max-width={fullWidth \? `\${fullWidth}px` : undefined}/);
});
