import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { CATALOG, FAMILIES } from '../src/demo/framework/catalog';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const index = await readFile(join(ROOT, 'src/lib/index.ts'), 'utf8');

/** @type {Map<string, string>} component file name → family, from index.ts */
const exported = new Map();
for (const m of index.matchAll(/'\.\/components\/(atoms|molecules|organisms|layouts)\/([A-Z]\w*)\.svelte'/g))
	exported.set(m[2], m[1]);

/** @param {string} family @param {string} name */
async function demoStatus(family, name) {
	const dir = join(ROOT, 'src/demo', family, name);
	try {
		if (!(await stat(dir)).isDirectory()) return { ok: false, reason: 'no directory' };
	} catch {
		return { ok: false, reason: 'no directory' };
	}
	const names = await readdir(dir);
	if (!names.includes('meta.ts')) return { ok: false, reason: 'no meta.ts' };
	const examples = names.filter((n) => n.endsWith('.svelte')).length;
	if (examples < 2) return { ok: false, reason: `${examples} example(s), need 2` };
	return { ok: true, reason: '' };
}

test('index.ts exports the expected number of components', () => {
	assert.ok(exported.size >= 98, `${exported.size} components`);
});

test('the catalog lists every exported component in the right family, and nothing else', () => {
	const catalogued = new Map();
	for (const family of FAMILIES) {
		if (family === 'foundations') continue;
		for (const name of Object.keys(CATALOG[family])) catalogued.set(name, family);
	}
	assert.deepEqual(
		[...catalogued.entries()].sort(),
		[...exported.entries()].sort()
	);
});

test('every exported component has a demo directory with meta.ts and at least two examples', async (t) => {
	const missing = [];
	for (const [name, family] of exported) {
		const s = await demoStatus(family, name);
		if (!s.ok) missing.push(`${family}/${name}: ${s.reason}`);
	}
	t.diagnostic(`${exported.size - missing.length}/${exported.size} components covered`);
	for (const m of missing) t.diagnostic(`missing ${m}`);
	assert.ok(!missing.some((m) => m.startsWith('atoms/Button:')), 'Button is the reference migration');
});
