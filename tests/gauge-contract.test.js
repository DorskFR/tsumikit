import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, index] = await Promise.all([
	readFile(new URL('../src/lib/components/atoms/Gauge.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/index.ts', import.meta.url), 'utf8')
]);

test('Gauge is exported with its tone type', () => {
	assert.match(index, /default as Gauge, type GaugeTone/);
});

test('props: value, variant, segments, tone thresholds, label, polymorphic as, corner', () => {
	assert.match(component, /value: number/);
	assert.match(component, /variant\?: 'continuous' \| 'segments'/);
	assert.match(component, /variant = 'continuous'/);
	assert.match(component, /segments\?: number/);
	assert.match(component, /segments = 3/);
	assert.match(component, /tone\?: GaugeTone/);
	assert.match(component, /warnAt = 70/);
	assert.match(component, /dangerAt = 90/);
	assert.match(component, /as\?: 'div' \| 'a' \| 'button'/);
	assert.match(component, /corner\?: Snippet/);
	assert.match(component, /class\?: string/);
	assert.match(component, /style\?: string/);
	assert.match(component, /\[key: string\]: unknown/);
	assert.match(component, /\.\.\.rest/);
	assert.match(component, /{\.\.\.rest}/);
});

test('meter semantics with 0..100 range and a label', () => {
	assert.match(component, /role="meter"/);
	assert.match(component, /aria-label={label}/);
	assert.match(component, /aria-valuemin={0}/);
	assert.match(component, /aria-valuemax=\{100\}/);
	assert.match(component, /aria-valuenow={pct}/);
	assert.match(component, /type={as === 'button' \? 'button' : undefined}/);
});

test('continuous variant fills upward by height', () => {
	assert.match(component, /<span class="fill" style:height="{pct}%"><\/span>/);
	assert.match(component, /\.fill\s*{[^}]*inset: auto 0 0 0;/);
});

test('segments variant stacks bars lit bottom-up', () => {
	assert.match(component, /{#each { length: segmentCount } as _, i \(i\)}/);
	assert.match(component, /class:lit={i < lit}/);
	assert.match(component, /\.segments\s*{[^}]*flex-direction: column-reverse;/);
	assert.match(component, /Math\.min\(segments, Math\.floor\(\(v \/ 100\) \* segments\)\)/);
});

test('threshold tones resolve to semantic tokens, explicit tone wins', () => {
	assert.match(component, /if \(v >= dangerAt\) return 'danger';/);
	assert.match(component, /if \(v >= warnAt\) return 'warn';/);
	assert.match(component, /tone \?\? gaugeTone\(pct, warnAt, dangerAt\)/);
	assert.match(component, /\.tone-ok\s*{\s*--gauge-fill: var\(--ok\);/);
	assert.match(component, /\.tone-warn\s*{\s*--gauge-fill: var\(--warn\);/);
	assert.match(component, /\.tone-danger\s*{\s*--gauge-fill: var\(--danger\);/);
});

test('corner slot sits at the lower right', () => {
	assert.match(component, /{#if corner}\s*<span class="corner">{@render corner\(\)}<\/span>/);
	assert.match(component, /\.corner\s*{[^}]*right: -0\.35em;[^}]*bottom: -0\.35em;/);
});

test('sized via CSS vars with 14x20 defaults, tokens only, no :global', () => {
	assert.match(component, /width: var\(--gauge-w, 0\.875rem\)/);
	assert.match(component, /height: var\(--gauge-h, 1\.25rem\)/);
	assert.match(component, /style:--gauge-w={width}/);
	assert.match(component, /style:--gauge-h={height}/);
	assert.doesNotMatch(component, /:global/);
	assert.doesNotMatch(component, /#[0-9a-f]{3,8}\b/i);
});

/** @param {string} name */
function extract(name) {
	const m = component.match(new RegExp(`export function ${name}\\([^)]*\\)[^{]*{[^]*?\\n\\t}`));
	assert.ok(m, `${name} helper present`);
	return m[0]
		.replace(/: (number|GaugeTone)\b/g, '')
		.replace(/export /, '');
}

const helpers = new Function(`${extract('clampPct')}\n${extract('gaugeTone')}\n${extract('litSegments')}\nreturn { clampPct, gaugeTone, litSegments };`)();

test('gaugeTone thresholds', () => {
	assert.equal(helpers.gaugeTone(0), 'ok');
	assert.equal(helpers.gaugeTone(69.9), 'ok');
	assert.equal(helpers.gaugeTone(70), 'warn');
	assert.equal(helpers.gaugeTone(89.9), 'warn');
	assert.equal(helpers.gaugeTone(90), 'danger');
	assert.equal(helpers.gaugeTone(150), 'danger');
	assert.equal(helpers.gaugeTone(50, 40, 60), 'warn');
	assert.equal(helpers.gaugeTone(Number.NaN), 'ok');
});

test('litSegments lights 1 at >=1/3, 2 at >=2/3, 3 at 100', () => {
	assert.equal(helpers.litSegments(0), 0);
	assert.equal(helpers.litSegments(33), 0);
	assert.equal(helpers.litSegments(34), 1);
	assert.equal(helpers.litSegments(66), 1);
	assert.equal(helpers.litSegments(67), 2);
	assert.equal(helpers.litSegments(99), 2);
	assert.equal(helpers.litSegments(100), 3);
	assert.equal(helpers.litSegments(50, 4), 2);
	assert.equal(helpers.litSegments(100, 5), 5);
	assert.equal(helpers.litSegments(50, 0), 0);
});
