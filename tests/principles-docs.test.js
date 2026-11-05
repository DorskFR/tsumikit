import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const principlesDir = new URL('../principles/', import.meta.url);
const stylesDir = new URL('../src/lib/styles/', import.meta.url);

const inFlightTokens = new Set([]);
const inFlightExports = new Set([]);

const requiredHeadings = ['## Why', '## Do', "## Don't", '## In tsumikit', '## Check'];

const files = (await readdir(principlesDir)).filter((f) => /^\d{2}-[a-z0-9-]+\.md$/.test(f)).sort();
const docs = new Map();
for (const f of files) docs.set(f, await readFile(new URL(f, principlesDir), 'utf8'));
const readme = await readFile(new URL('README.md', principlesDir), 'utf8');

const declaredTokens = new Set();
for (const css of await readdir(stylesDir)) {
	if (!css.endsWith('.css')) continue;
	const text = await readFile(new URL(css, stylesDir), 'utf8');
	for (const m of text.matchAll(/(--[a-z0-9-]+)\s*:/g)) declaredTokens.add(m[1]);
}

const index = await readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8');
const exported = new Set();
for (const m of index.matchAll(/default as ([A-Za-z]+)/g)) exported.add(m[1]);
for (const block of index.matchAll(/export (?:type )?\{([^}]*)\}/g)) {
	for (const part of block[1].split(',')) {
		const name = part.trim().replace(/^type /, '').replace(/^default as /, '').split(/\s+/)[0];
		if (name) exported.add(name);
	}
}

const section = (doc, heading) => {
	const start = doc.indexOf(`\n${heading}\n`);
	if (start < 0) return '';
	const rest = doc.slice(start + heading.length + 2);
	const end = rest.indexOf('\n## ');
	return end < 0 ? rest : rest.slice(0, end);
};

test('there are about twenty principle files, numbered in order', () => {
	assert.ok(files.length >= 20, `found ${files.length}`);
	files.forEach((f, i) => assert.equal(f.slice(0, 2), String(i + 1).padStart(2, '0'), f));
});

test('every principle has a title, a one-line statement and the required headings', () => {
	for (const [f, doc] of docs) {
		const lines = doc.split('\n');
		assert.match(lines[0], /^# \S/, `${f}: missing H1`);
		assert.ok(lines[2]?.trim() && !lines[2].startsWith('#'), `${f}: line 3 must state the principle`);
		for (const h of requiredHeadings) assert.ok(doc.includes(`\n${h}\n`), `${f}: missing "${h}"`);
		assert.match(section(doc, '## Why'), /https?:\/\/\S+/, `${f}: Why must cite a source URL`);
		assert.doesNotMatch(doc, /\p{Extended_Pictographic}/u, `${f}: no emoji`);
	}
});

test('every cited --token exists in the stylesheets', () => {
	for (const [f, doc] of docs) {
		for (const m of doc.matchAll(/`(--[a-z0-9-]+)`/g)) {
			const token = m[1];
			assert.ok(declaredTokens.has(token) || inFlightTokens.has(token), `${f}: unknown token ${token}`);
		}
	}
});

test('every component or helper cited under "In tsumikit" is exported', () => {
	for (const [f, doc] of docs) {
		const body = section(doc, '## In tsumikit');
		assert.ok(body.trim(), `${f}: empty "In tsumikit"`);
		for (const m of body.matchAll(/`([A-Z][A-Za-z]+|[a-z][A-Za-z]*(?:\.[a-z][A-Za-z]*)?\(\))`/g)) {
			const name = m[1].replace(/\(\)$/, '').split('.')[0];
			assert.ok(exported.has(name) || inFlightExports.has(name), `${f}: ${m[1]} is not exported`);
		}
	}
});

test('the README indexes every principle and nothing else', () => {
	const linked = [...readme.matchAll(/\]\((\d{2}-[a-z0-9-]+\.md)\)/g)].map((m) => m[1]);
	assert.deepEqual(linked, files);
	assert.ok(/## Designing a screen/.test(readme), 'README is missing the screen checklist');
});

test('the in-flight allow-lists only name things that are still missing', () => {
	for (const t of inFlightTokens) assert.ok(!declaredTokens.has(t), `${t} exists now; prune it`);
	for (const e of inFlightExports) assert.ok(!exported.has(e), `${e} exists now; prune it`);
});
