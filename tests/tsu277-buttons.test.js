import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const src = await read('src/lib/components/atoms/Button.svelte');
const style = src.slice(src.indexOf('<style>'), src.indexOf('</style>'));
const fxBlock = style.slice(style.indexOf('/* Ambient hover'));
const hoverBlock = fxBlock.slice(fxBlock.indexOf('@media (hover: hover) and (pointer: fine)'));

/** @param {string} v */
const closest = (v) =>
	`.btn:where(:global([data-fx-hover='${v}']) *):where(:not(:global([data-fx-hover='${v}'] [data-fx-hover]:not([data-fx-hover='${v}'])) *))`;

test('smoke is the default with no attribute and every picked variant resolves the closest ancestor', () => {
	const smoke = `.btn:where(:not(:global([data-fx-hover]) *), :global([data-fx-hover='smoke']) *):where(:not(:global([data-fx-hover='smoke'] [data-fx-hover]:not([data-fx-hover='smoke'])) *))`;
	assert.ok(hoverBlock.includes(`${smoke}::before`), 'smoke ::before');
	assert.ok(hoverBlock.includes(`${smoke}::after`), 'smoke ::after');
	for (const v of ['ember', 'aurora']) {
		assert.ok(hoverBlock.includes(`${closest(v)}::before`), `${v} ::before`);
		assert.ok(hoverBlock.includes(`${closest(v)}::after`), `${v} ::after`);
	}
	assert.doesNotMatch(hoverBlock, /data-fx-hover='none'\]\) \*\)::(before|after)/);
	assert.match(hoverBlock, /:global\(\[data-fx-hover\]:not\(\[data-fx-hover='none'\]\)\) \*\) \{\s*position: relative;\s*isolation: isolate;\s*overflow: hidden;/);
});

test('layers sit under the content, run only while hovered, hold still on focus, and skip boxless or counted buttons', () => {
	assert.match(hoverBlock, /::after \{\s*content: '';\s*position: absolute;\s*inset: 0;\s*z-index: -1;\s*pointer-events: none;\s*opacity: 0;/);
	const paused = hoverBlock.indexOf('.btn:not(:hover)::before,\n\t\t.btn:not(:hover)::after,\n\t\t.btn:disabled::before,\n\t\t.btn:disabled::after {\n\t\t\tanimation-play-state: paused;');
	assert.ok(paused > hoverBlock.lastIndexOf('animation: fx-'), 'paused rule follows every animation shorthand');
	assert.doesNotMatch(hoverBlock, /animation-play-state: running/);
	assert.match(hoverBlock, /\.btn:focus-visible::before,\s*\.btn:focus-visible::after \{\s*opacity: 1;/);
	assert.match(hoverBlock, /\.btn:where\(:not\(\.btn-link, \.btn-icon-inline, \.btn-counted\)\)/);
	assert.doesNotMatch(hoverBlock.replace(/:where\([^{]*?\)(?=[:\s,{])/g, ''), /\.btn[^,{]*:not\(:global/, 'ancestor chains stay inside :where() so plain .btn rules keep their specificity');
	const ungated = fxBlock.slice(0, fxBlock.indexOf('@media (hover: hover)'));
	assert.doesNotMatch(ungated, /:hover/);
});

test('ambient loops are infinite keyframes on transform-only properties', () => {
	const loops = [...hoverBlock.matchAll(/animation: (fx-[\w-]+) [^;]*infinite/g)].map((m) => m[1]);
	assert.deepEqual([...new Set(loops)], ['fx-smoke', 'fx-smoke-b', 'fx-ember', 'fx-sparks', 'fx-aurora', 'fx-aurora-back']);
	for (const name of new Set(loops)) assert.match(style, new RegExp(`@keyframes ${name} \\{`), name);
	const keyframes = style.slice(style.indexOf('@keyframes fx-smoke'));
	assert.doesNotMatch(keyframes, /\b(width|height|top|left|margin|padding|opacity|inset)\s*:/);
});

test('press scales in over --dur-press and springs back over --dur-release; ember presses lighter and sinks half a --shift-xs', () => {
	assert.match(style, /--btn-scale-dur: var\(--dur-release\);\s*--btn-scale-ease: var\(--ease-spring-bounce\);/);
	assert.match(style, /scale var\(--btn-scale-dur\) var\(--btn-scale-ease\);/);
	assert.match(style, /\.btn:active:not\(:disabled, \[aria-disabled='true'\], \.loading, \.btn-link\) \{\s*--btn-scale-dur: var\(--dur-press\);\s*--btn-scale-ease: var\(--ease-out\);\s*scale: var\(--press-scale\);/);
	assert.ok(hoverBlock.includes(`${closest('ember')} {\n\t\t\t--press-scale: var(--press-scale-lg);`));
	assert.match(hoverBlock, /translate: 0 calc\(var\(--shift-xs\) \/ 2 - var\(--hover-lift\)\);\s*--btn-shadow-rest: none;/);
	for (const m of style.matchAll(/transition:([^;]+);/g)) {
		for (const part of m[1].split(',')) {
			const ms = part.match(/(\d+)ms/);
			if (ms) assert.ok(Number(ms[1]) <= 300, part.trim());
		}
	}
	assert.doesNotMatch(style, /transition:\s*all/);
});

test('reduced motion is left to the global reset: no per-component block, the sink rides a token the reset zeroes', () => {
	assert.doesNotMatch(style, /prefers-reduced-motion/);
	assert.match(hoverBlock, /transition: opacity var\(--dur-fast\) ease;/);
});

test('colours come from theme tokens; literal colours only feed masks', () => {
	const lines = fxBlock.split('\n').filter((l) => /#[0-9a-f]{3,8}\b|rgb\(|hsl\(|\bwhite\b|\bblack\b/i.test(l));
	assert.deepEqual(lines.filter((l) => !/mask(-image)?:/.test(l)), []);
	for (const tok of ['--accent', '--text-on-accent', '--warn', '--info', '--ok', '--danger', '--btn-tone']) assert.ok(fxBlock.includes(`var(${tok}`), tok);
});

test('loadingStyle is optional, defaults to the inline spinner and keeps the old markup for it', () => {
	assert.match(src, /loading\?: boolean \| 'done';/);
	assert.match(src, /loadingStyle\?: 'spinner' \| 'morph' \| 'fill';/);
	assert.match(src, /progress\?: number;/);
	assert.match(src, /loadingStyle = 'spinner',/);
	assert.match(src, /const busy = \$derived\(loading === true\);/);
	assert.match(src, /const inactive = \$derived\(disabled \|\| busy\);/);
	assert.match(src, /aria-busy=\{busy \|\| undefined\}/);
	assert.match(src, /\{#if busy && !layered\}<span class="btn-spinner" aria-hidden="true"><\/span>/);
	assert.match(src, /class:loading=\{busy\}/);
});

test('morph stacks label, spinner and done check in one grid cell; fill drives a scaled bar and a clip-path ink layer', () => {
	assert.match(src, /<span class="btn-layers">\s*<span class="btn-layer btn-layer-label">\{@render children\?\.\(\)\}<\/span>/);
	assert.match(src, /<span class="btn-layer btn-layer-spin" aria-hidden="true"><\/span>/);
	assert.match(src, /<span class="btn-layer btn-layer-done" aria-hidden="true"><Icon name="check" \/>\{#if doneLabel !== undefined\}\{doneLabel\}\{:else\}\{@render children\?\.\(\)\}\{\/if\}<\/span>/);
	assert.match(src, /doneLabel\?: string;/);
	assert.match(src, /<span class="btn-layer btn-layer-ink" aria-hidden="true">\{@render children\?\.\(\)\}<\/span>/);
	assert.match(src, /\{#if loadingStyle === 'fill'\}<span class="btn-fill-bar" aria-hidden="true"><\/span>\{\/if\}/);
	assert.match(src, /style:--btn-progress=\{loadingStyle === 'fill' && progress !== undefined \? Math\.min\(1, Math\.max\(0, progress\)\) : undefined\}/);
	assert.match(style, /\.btn-layers \{\s*position: relative;\s*display: grid;\s*place-items: center;/);
	assert.match(style, /\.btn-layer \{\s*grid-area: 1 \/ 1;/);
	assert.match(style, /\.btn-fill-bar \{[^}]*scale: var\(--btn-progress, 0\) 1;\s*transform-origin: left;\s*transition: scale var\(--dur-slow\) var\(--ease-out\);/);
	assert.match(style, /\.btn-layer-ink \{\s*color: var\(--btn-progress-fg\);\s*clip-path: inset\(0 calc\(\(1 - var\(--btn-progress, 0\)\) \* 100%\) 0 0\);/);
	assert.match(style, /\.btn-fill\.btn-primary \{\s*--btn-progress-fill: color-mix\(in srgb, var\(--text-on-accent\) 22%, transparent\);/);
	assert.doesNotMatch(style.slice(style.indexOf('/* Loading styles')), /transition:[^;]*\b(width|height|top|left|margin|padding|transform)\b/);
});

test('the demo shows the four hover variants on wrappers and the three loading styles', async () => {
	const hover = await read('src/demo/atoms/Button/06-Hover.svelte');
	assert.match(hover, /const variants = \['smoke', 'ember', 'aurora', 'none'\] as const;/);
	assert.match(hover, /<div data-fx-hover=\{variant\}>/);
	const loading = await read('src/demo/atoms/Button/07-Loading.svelte');
	assert.match(loading, /loadingStyle="morph" loading=\{save\} doneLabel="Saved"/);
	assert.match(loading, /loadingStyle="fill" loading=\{uploading\} progress=\{upload\}/);
	assert.match(loading, /<Button loading="done">/);
});

test('FileButton mirrors the spring press release', async () => {
	const file = await read('src/lib/components/molecules/FileButton.svelte');
	assert.match(file, /--file-scale-dur: var\(--dur-release\);\s*--file-scale-ease: var\(--ease-spring-bounce\);/);
	assert.match(file, /scale var\(--file-scale-dur\) var\(--file-scale-ease\);/);
	assert.match(file, /\.file-btn:active:not\(\.disabled\) \{\s*--file-scale-dur: var\(--dur-press\);\s*--file-scale-ease: var\(--ease-out\);/);
});

test('the closest data-fx-hover ancestor wins: a wrapper overrides the root, in jsdom', async () => {
	const { JSDOM } = await import('jsdom');
	const dom = new JSDOM(`<div data-fx-hover="aurora"><div data-fx-hover="smoke"><button class="btn" id="smoke"></button></div><div data-fx-hover="none"><button class="btn" id="none"></button></div><button class="btn" id="aurora"></button></div><button class="btn" id="bare"></button>`);
	/** @param {string} sel */
	const unscope = (sel) => sel.replace(/:global\(((?:[^()]|\([^()]*\))*)\)/g, '$1');
	const rules = {
		smoke: `.btn:where(:not(:global([data-fx-hover]) *), :global([data-fx-hover='smoke']) *):where(:not(:global([data-fx-hover='smoke'] [data-fx-hover]:not([data-fx-hover='smoke'])) *))`,
		aurora: closest('aurora'),
		ember: closest('ember'),
	};
	for (const sel of Object.values(rules)) assert.ok(hoverBlock.includes(sel), sel);
	/** @param {string} sel */
	const hits = (sel) => [...dom.window.document.querySelectorAll(unscope(sel))].map((el) => el.id);
	assert.deepEqual(hits(rules.smoke), ['smoke', 'bare']);
	assert.deepEqual(hits(rules.aurora), ['aurora']);
	assert.deepEqual(hits(rules.ember), []);
});
