import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { rule } from './helpers.mjs';
import { FAINT_FLOOR, MUTED_OVER_FAINT, SURFACES, TEXT_FLOOR, contrast, palettes } from './theme-contrast.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const [tokens, themes, field, keyValue, metric, demo, demoTokens] = await Promise.all([
	read('src/lib/styles/tokens.css'),
	read('src/lib/styles/themes.css'),
	read('src/lib/components/molecules/Field.svelte'),
	read('src/lib/components/molecules/KeyValue.svelte'),
	read('src/lib/components/molecules/Metric.svelte'),
	read('src/demo/foundations/ThemeTokens/05-TextLevels.svelte'),
	read('src/demo/foundations/ThemeTokens/tokens.ts')
]);
const { palettes: all } = palettes(tokens, themes);

for (const [id, p] of Object.entries(all)) {
	test(`${id}: muted reads as text, faint is quieter but still 3:1`, () => {
		const muted = contrast(p['text-muted'], p.bg);
		const faint = contrast(p['text-faint'], p.bg);
		assert.ok(muted >= TEXT_FLOOR, `muted/bg ${muted.toFixed(2)}`);
		assert.ok(faint >= FAINT_FLOOR, `faint/bg ${faint.toFixed(2)}`);
		assert.ok(muted / faint >= MUTED_OVER_FAINT, `muted/faint ${(muted / faint).toFixed(2)}`);
		for (const s of SURFACES) {
			assert.ok(contrast(p['text-muted'], p[s]) >= TEXT_FLOOR, `muted/${s}`);
			assert.ok(contrast(p['text-faint'], p[s]) >= FAINT_FLOOR, `faint/${s}`);
		}
	});
}

test('every theme block sets its own --c-text-faint', () => {
	const blocks = [...themes.matchAll(/^\[data-theme="([a-z]+)"\] {([^}]*)}/gm)];
	assert.ok(blocks.length >= 30);
	for (const [, id, body] of blocks) assert.match(body, /--c-text-faint: #[0-9a-f]{6}/, id);
});

test('essential labels never use --text-faint', () => {
	assert.equal(rule(field, '.label').color, 'var(--text-muted)');
	assert.equal(rule(field, '.hint').color, 'var(--text-muted)');
	assert.doesNotMatch(field, /--text-faint/);
	assert.equal(rule(keyValue, '.kv-label').color, 'var(--text-muted)');
	assert.doesNotMatch(keyValue, /--text-faint/);
	assert.equal(rule(metric, '.metric-label').color, 'var(--text-muted)');
	assert.equal(rule(metric, '.metric-sub').color, 'var(--text-muted)');
	assert.doesNotMatch(metric, /--text-faint/);
});

test('faint is reserved for exempt text: placeholders, shortcut hints, separators, comments stay off muted', async () => {
	const [input, textarea, kbd, timeDisplay] = await Promise.all(
		['atoms/Input', 'atoms/Textarea', 'atoms/Kbd', 'atoms/TimeDisplay'].map((n) => read(`src/lib/components/${n}.svelte`))
	);
	assert.match(input, /::placeholder \{\s*color: var\(--text-faint\);/);
	assert.match(textarea, /::placeholder \{\s*color: var\(--text-faint\);/);
	assert.equal(rule(kbd, '.kbd-sep').color, 'var(--text-faint)');
	assert.equal(rule(timeDisplay, '.td-sep').color, 'var(--text-faint)');
	assert.match(tokens, /--syn-comment: var\(--c-text-muted\);/);
	assert.match(tokens, /--dot-dead: var\(--c-text-faint\);/);
});

test('the demo shows a text-levels swatch per theme', () => {
	assert.match(demo, /\{#each THEMES as t \(t\.id\)\}/);
	assert.match(demo, /data-theme=\{t\.id\}/);
	for (const level of ['--text', '--text-muted', '--text-faint']) assert.ok(demo.includes(`color: var(${level});`), level);
	assert.match(demoTokens, /\['--text-faint', 'Placeholder, disabled'\]/);
});
