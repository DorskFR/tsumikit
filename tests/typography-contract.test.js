import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(p, import.meta.url), 'utf8');
const [text, heading, progress, segmented, tone, index] = await Promise.all([
	read('../src/lib/components/atoms/Text.svelte'),
	read('../src/lib/components/atoms/Heading.svelte'),
	read('../src/lib/components/atoms/Progress.svelte'),
	read('../src/lib/components/atoms/SegmentedProgress.svelte'),
	read('../src/lib/tone.ts'),
	read('../src/lib/index.ts')
]);

const SHARED_PROPS = {
	italic: 'boolean',
	nowrap: 'boolean',
	wrap: "'normal' \\| 'anywhere' \\| 'balance'",
	uppercase: 'boolean',
	leading: "'tight' \\| 'normal' \\| 'none'",
	measure: 'string',
	grow: 'boolean',
	scale: 'boolean'
};

for (const [name, src] of [
	['Text', text],
	['Heading', heading]
]) {
	test(`${name} declares the shared typography props`, () => {
		for (const [prop, type] of Object.entries(SHARED_PROPS)) {
			assert.match(src, new RegExp(`\\b${prop}\\?: ${type};`), `${name}.${prop}`);
		}
		assert.match(src, /scale = true/);
		assert.match(src, /class:noscale={!scale}/);
		assert.match(src, /\.italic\s*{\s*font-style: italic;/);
		assert.match(src, /\.nowrap\s*{\s*white-space: nowrap;/);
		assert.match(src, /\.wrap-anywhere\s*{\s*min-width: 0;\s*overflow-wrap: anywhere;/);
		assert.match(src, /\.wrap-balance\s*{\s*text-wrap: balance;/);
		assert.match(src, /\.uppercase\s*{\s*text-transform: uppercase;\s*letter-spacing: 0\.04em;/);
		assert.match(src, /\.lh-tight\s*{\s*line-height: var\(--lh-tight\);/);
		assert.match(src, /\.lh-normal\s*{\s*line-height: var\(--lh-normal\);/);
		assert.match(src, /\.lh-none\s*{\s*line-height: 1;/);
		assert.match(src, /\.grow\s*{\s*flex: 1 1 0;\s*min-width: 0;/);
		assert.match(src, /max-width: \${measure}/);
	});

	test(`${name} noscale pins each size to its px value after the scaled rules`, () => {
		const px = { xs: 12, sm: 13, md: 16, lg: 18, xl: 22, '2xl': 28, ...(name === 'Text' ? { base: 15 } : {}) };
		for (const [size, value] of Object.entries(px)) {
			const scaled = src.search(new RegExp(`\\.fs-${size}\\s*{\\s*font-size: var\\(--fs-${size}\\);`));
			const pinned = src.search(new RegExp(`\\.noscale\\.fs-${size}\\s*{\\s*font-size: ${value}px;`));
			assert.ok(scaled >= 0 && pinned > scaled, `${name} .noscale.fs-${size}`);
		}
	});
}

test('Text gets block and the eyebrow preset', () => {
	assert.match(text, /block\?: boolean;/);
	assert.match(text, /\.block\s*{\s*display: block;/);
	assert.match(text, /variant\?: 'body' \| 'label' \| 'caption' \| 'code' \| 'eyebrow'/);
	assert.match(
		text,
		/\.v-eyebrow\s*{\s*font-size: var\(--fs-xs\);\s*color: var\(--text-muted\);\s*font-weight: var\(--fw-medium\);\s*text-transform: uppercase;\s*letter-spacing: 0\.04em;/
	);
});

test('Heading truncates like Text without the inline-block shim', () => {
	assert.match(heading, /truncate\?: boolean;/);
	assert.match(heading, /class:truncate/);
	assert.match(
		heading,
		/\.truncate\s*{\s*max-width: 100%;\s*overflow: hidden;\s*text-overflow: ellipsis;\s*white-space: nowrap;\s*min-width: 0;/
	);
	assert.doesNotMatch(heading, /display: inline-block/);
});

test('tone.ts exports Tone and canonicalTone (success → ok)', () => {
	assert.match(tone, /export type Tone = 'neutral' \| 'ok' \| 'success' \| 'warn' \| 'danger' \| 'info' \| 'accent';/);
	assert.match(tone, /export function canonicalTone<T extends string>\(t: T\)/);
	assert.match(tone, /t === 'success' \? 'ok' : t/);
	assert.match(index, /export { canonicalTone, type Tone } from '\.\/tone';/);
});

test("'ok' is accepted as an alias of 'success' in Text, Progress and SegmentedProgress", () => {
	assert.match(text, /tone\?: 'inherit' \| 'default' \| 'muted' \| 'faint' \| Tone;/);
	assert.match(text, /canonicalTone\(tone\) === 'ok' \? 'success' : canonicalTone\(tone\)/);
	assert.match(text, /tone-{toneClass}/);
	assert.match(text, /\.tone-success\s*{\s*color: var\(--ok\);/);
	assert.match(progress, /tone\?: Tone;/);
	assert.match(progress, /canonicalTone\(tone\) === 'ok' \? 'success' : canonicalTone\(tone\)/);
	assert.match(progress, /tone-{toneClass}/);
	assert.match(progress, /\.tone-success\s*{\s*--fill: var\(--ok\);/);
	assert.match(segmented, /tone\?: Tone \| 'muted'/);
	assert.match(segmented, /\.tone-success,\s*\.tone-ok\s*{/);
});
