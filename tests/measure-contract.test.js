import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const [tokens, prose, text, proseDemo] = await Promise.all([
	read('src/lib/styles/tokens.css'),
	read('src/lib/components/molecules/Prose.svelte'),
	read('src/lib/components/atoms/Text.svelte'),
	read('src/demo/molecules/Prose/05-Measure.svelte')
]);
const proseCss = prose.slice(prose.indexOf('<style>'));

test('tokens.css defines --measure inside the 45–75ch reading range', () => {
	const ch = Number(tokens.match(/^  --measure: (\d+)ch;/m)?.[1]);
	assert.ok(ch >= 45 && ch <= 75, `--measure: ${ch}ch`);
});

test('.prose caps its inline size at the token and nothing else', () => {
	assert.ok(hasDecl(proseCss, '.prose', 'max-inline-size', 'var(--measure)'));
	assert.doesNotMatch(proseCss, /max-width: var\(--measure\)/);
	assert.doesNotMatch(proseCss, /max-inline-size: \d/);
	assert.ok(hasDecl(proseCss, '.prose :global(table)', 'width', '100%'));
	assert.ok(hasDecl(proseCss, '.prose :global(img)', 'max-width', '100%'));
});

test('Text `measure` accepts true (token) or a CSS length', () => {
	assert.match(text, /measure\?: string \| boolean;/);
	assert.match(text, /max-width: \$\{measure === true \? 'var\(--measure\)' : measure\}/);
});

test('the Prose demo shows the default cap next to the --measure: none override', () => {
	assert.match(proseDemo, /<Prose html=/);
	assert.match(proseDemo, /--measure: none/);
});
