import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DEMO = join(ROOT, 'src/demo');
const COMPONENT_FAMILIES = ['atoms', 'molecules', 'organisms', 'layouts'];
const index = await readFile(join(ROOT, 'src/lib/index.ts'), 'utf8');

/** @type {Map<string, string>} component file name → family, from index.ts */
const exported = new Map();
for (const m of index.matchAll(/'\.\/components\/(atoms|molecules|organisms|layouts)\/([A-Z]\w*)\.svelte'/g))
	exported.set(m[2], m[1]);

/** @type {Map<string, string[]>} demo directory name → its files, per component family */
const demoed = new Map();
for (const family of COMPONENT_FAMILIES)
	for (const d of await readdir(join(DEMO, family), { withFileTypes: true }))
		if (d.isDirectory()) demoed.set(`${family}/${d.name}`, await readdir(join(DEMO, family, d.name)));

test('index.ts exports the expected number of components', () => {
	assert.ok(exported.size >= 98, `${exported.size} components`);
});

test('every exported component has a demo directory in its family, and nothing else does', () => {
	const expected = [...exported].map(([name, family]) => `${family}/${name}`).sort();
	const actual = [...demoed.keys()].sort();
	assert.deepEqual(
		expected.filter((k) => !demoed.has(k)),
		[],
		'exported components without a demo directory'
	);
	assert.deepEqual(actual, expected);
});

test('every demo directory has a meta.ts and at least two examples', () => {
	const short = [];
	for (const [dir, files] of demoed) {
		if (!files.includes('meta.ts')) short.push(`${dir}: no meta.ts`);
		const examples = files.filter((n) => n.endsWith('.svelte')).length;
		if (examples < 2) short.push(`${dir}: ${examples} example(s), need 2`);
	}
	assert.deepEqual(short, []);
});
