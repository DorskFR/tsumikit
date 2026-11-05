import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PRINCIPLES = join(ROOT, 'principles');
const ROUTE = join(ROOT, 'src/routes/principles');

const files = (await readdir(PRINCIPLES)).filter((f) => /^\d{2}-[\w-]+\.md$/.test(f)).sort();
const docs = await Promise.all(
	files.map(async (file) => {
		const raw = await readFile(join(PRINCIPLES, file), 'utf8');
		const lines = raw.split('\n');
		const titleAt = lines.findIndex((l) => l.startsWith('# '));
		const lead = lines.slice(titleAt + 1).find((l) => l.trim()) ?? '';
		return { id: file.slice(0, 2), file, title: lines[titleAt]?.slice(2).trim(), lead, raw };
	}),
);
const readme = await readFile(join(PRINCIPLES, 'README.md'), 'utf8');
const source = await readFile(join(ROUTE, 'principles.ts'), 'utf8');
const page = await readFile(join(ROUTE, '+page.svelte'), 'utf8');

test('there is one numbered principle file per index row and no gaps', () => {
	assert.ok(docs.length >= 30, `${docs.length} principle files`);
	assert.deepEqual(
		docs.map((d) => d.id),
		docs.map((_, i) => String(i + 1).padStart(2, '0')),
	);
	for (const d of docs) assert.ok(readme.includes(`](${d.file})`), `${d.file} missing from README index`);
});

test('every principle file has the shape the page parses: title, lead and the fixed sections', () => {
	for (const d of docs) {
		assert.ok(d.title, `${d.file}: no "# " title`);
		assert.ok(d.lead && !d.lead.startsWith('#'), `${d.file}: no one-line lead under the title`);
		for (const h of ['## Why', '## Do', "## Don't", '## In tsumikit', '## Check'])
			assert.ok(d.raw.includes(`\n${h}\n`), `${d.file}: missing "${h}"`);
	}
});

test('the page renders from the markdown files, not from a copy', () => {
	assert.match(source, /import\.meta\.glob<string>\('\/principles\/\*\.md'/);
	assert.match(source, /query: '\?raw'/);
	assert.match(page, /\{#each principles as p/);
	assert.match(page, /<Prose html=\{p\.html\}/);
	assert.match(page, /<Prose html=\{overviewHtml\}/);
});

test('every live do/don\'t pair points at an existing principle', () => {
	const ids = [...page.matchAll(/p\.id === '(\d{2})'/g)].map((m) => m[1]);
	assert.ok(ids.length >= 10, `${ids.length} pairs`);
	const known = new Set(docs.map((d) => d.id));
	assert.deepEqual(ids.filter((id) => !known.has(id)), []);
	assert.equal(new Set(ids).size, ids.length, 'duplicate pair');
});

test('the prerendered page contains every principle title and anchor', { skip: !existsSync(join(ROOT, 'build/principles.html')) && 'run vite build first' }, async () => {
	const html = await readFile(join(ROOT, 'build/principles.html'), 'utf8');
	const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	for (const d of docs) {
		assert.ok(html.includes(escape(d.title)) || html.includes(d.title), `${d.file}: title not rendered`);
		assert.ok(html.includes(`id="p-${d.id}"`), `${d.file}: no #p-${d.id} section`);
		assert.ok(html.includes(`href="#p-${d.id}"`), `${d.file}: no sidebar link`);
	}
});
