import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const DIR = new URL('../src/lib/looks/', import.meta.url);
const files = (await readdir(DIR)).filter((f) => f.endsWith('.css')).sort();
const SCOPE = ':where([data-tsu="ChatBubble"])';

test('looks style .bubble only on ChatBubble, so CapBar keeps its own cap bubble', async () => {
	const offenders = [];
	let scoped = 0;
	for (const file of files) {
		const css = (await readFile(new URL(file, DIR), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, (c) =>
			c.replace(/[^\n]/g, ' ')
		);
		const lines = css.split('\n');
		for (const [i, line] of lines.entries()) {
			for (const m of line.matchAll(/\.bubble(?![\w-])/g)) {
				if (line.startsWith(SCOPE, m.index + m[0].length)) scoped++;
				else offenders.push(`${file}:${i + 1}: ${line.trim()}`);
			}
		}
	}
	assert.deepEqual(offenders, []);
	assert.ok(scoped > 0, 'the looks still style ChatBubble');
});

test('ChatBubble and CapBar carry the hooks the looks scope on', async () => {
	const read = (/** @type {string} */ name) =>
		readFile(new URL(`../src/lib/components/molecules/${name}.svelte`, import.meta.url), 'utf8');
	const chat = await read('ChatBubble');
	assert.match(chat, /<article\s+data-tsu="ChatBubble"[^>]*class="bubble /);
	const cap = await read('CapBar');
	assert.doesNotMatch(cap, /data-tsu="ChatBubble"/);
});
