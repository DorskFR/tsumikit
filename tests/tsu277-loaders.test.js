import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { normalize } from './helpers.mjs';

const read = (/** @type {string} */ f) => readFile(new URL(`../src/${f}`, import.meta.url), 'utf8');
const files = {
	Spinner: await read('lib/components/atoms/Spinner.svelte'),
	Progress: await read('lib/components/atoms/Progress.svelte'),
	Skeleton: await read('lib/components/atoms/Skeleton.svelte'),
	Thinking: await read('lib/components/atoms/Thinking.svelte')
};
const css = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.slice(v.indexOf('<style>'))]));
const index = await read('lib/index.ts');

const NEW_RULES = {
	Spinner: /\.v-(comet|breath|morph|sweep)[^{]*\{[^}]*\}/g,
	Progress: /\.progress\.v-(liquid|stripes)[^{]*\{[^}]*\}/g,
	Skeleton: /\.v-(sheen|pulse)[^{]*\{[^}]*\}/g,
	Thinking: /[^{}]+\{[^}]*\}/g
};

test('Spinner adds comet, breath, morph and sweep as optional variants, icon still the default', () => {
	assert.match(files.Spinner, /variant = 'icon',/);
	for (const v of ['comet', 'breath', 'morph', 'sweep']) {
		assert.match(files.Spinner, new RegExp(`\\| '${v}'`), v);
		assert.match(css.Spinner, new RegExp(`\\.v-${v}`), v);
		assert.match(css.Spinner, new RegExp(`@keyframes tsu-spin-${v}\\s*\\{`), v);
	}
	assert.match(files.Spinner, /comet: \{ count: 1, wrap: false \}/);
	assert.match(files.Spinner, /breath: \{ count: 5, wrap: true \}/);
	assert.match(css.Spinner, /@property --tsu-spin-sweep\s*\{\s*syntax: '<angle>';\s*inherits: false;\s*initial-value: 0deg;/);
});

test('Spinner variants keep the currentColor contract and the shared reduced-motion halt', () => {
	assert.doesNotMatch(css.Spinner, /var\(--(accent|text|c-)/);
	assert.match(normalize(css.Spinner), /\.v-breath \.in span:nth-child\(5\) { opacity: 0\.28; }/);
	assert.match(normalize(css.Spinner), /\.v-comet::before { background: currentColor; opacity: 0\.1; }/);
	assert.match(
		normalize(css.Spinner),
		/@media \(prefers-reduced-motion: reduce\) { \.spinner\.spinner, \.spinner\.spinner span, \.spinner\.spinner::before, \.spinner\.spinner::after { animation: none; } }/
	);
});

test('Progress exposes variant default|liquid|stripes, default unchanged', () => {
	assert.match(files.Progress, /variant = 'default',/);
	assert.match(files.Progress, /variant\?: 'default' \| 'liquid' \| 'stripes';/);
	assert.match(files.Progress, /class="progress tone-\{toneClass\} size-\{size\} v-\{variant\} \{klass\}"/);
	const n = normalize(css.Progress);
	assert.match(n, /\.progress\.v-liquid\.indeterminate \.bar { animation: none; opacity: 0; }/);
	assert.match(n, /\.progress\.v-liquid\.indeterminate::before, \.progress\.v-liquid\.indeterminate::after {[^}]*transform: translateX\(-100%\); animation: tsu-progress-liquid 1\.7s var\(--ease-drawer\) infinite; }/);
	assert.match(n, /\.progress\.v-stripes \.bar::after {[^}]*animation: tsu-progress-stripes 0\.7s linear infinite; }/);
	assert.match(n, /@keyframes tsu-progress-liquid { to { transform: translateX\(282%\); } }/);
	assert.match(n, /@keyframes tsu-progress-stripes { from { transform: translateX\(-1\.4142rem\); } to { transform: translateX\(0\); } }/);
	assert.match(n, /\.progress\.v-liquid\.indeterminate { background: color-mix\(in srgb, var\(--fill, var\(--accent\)\) 35%, transparent\); }/);
	assert.match(n, /\.progress\.v-stripes \.bar::after { animation: none; }/);
	assert.match(css.Progress, /var\(--fill, var\(--accent\)\) 35% 65%/, 'liquid pulses follow the tone');
});

test('Skeleton exposes variant shimmer|sheen|pulse with a staggered pulse and a static sheen pose', () => {
	assert.match(files.Skeleton, /variant = 'shimmer',/);
	assert.match(files.Skeleton, /variant\?: 'shimmer' \| 'sheen' \| 'pulse';/);
	assert.match(files.Skeleton, /class="skeleton v-\{variant\} \{klass\}"/);
	assert.match(files.Skeleton, /style:--i=\{i\}/);
	const n = normalize(css.Skeleton);
	assert.match(n, /\.v-sheen \.skeleton-bar { position: relative; overflow: hidden; animation: none; }/);
	assert.match(n, /\.v-sheen \.skeleton-bar::after {[^}]*width: 45%;[^}]*transform: translateX\(-100%\); animation: tsu-skeleton-sheen 2s var\(--ease-in-out\) infinite; }/);
	assert.match(n, /\.v-pulse \.skeleton-bar { animation: tsu-skeleton-pulse 1\.6s var\(--ease-in-out\) infinite; animation-delay: calc\(0\.13s \* \(var\(--i, 0\) \+ var\(--skeleton-phase, 0\)\)\); }/);
	assert.match(n, /@keyframes tsu-skeleton-sheen { 70%, 100% { transform: translateX\(260%\); } }/);
	assert.match(n, /\.v-pulse \.skeleton-bar { animation: none; } \.v-sheen \.skeleton-bar::after { animation: none; transform: translateX\(60%\); }/);
	assert.match(css.Skeleton, /\.v-sheen \.skeleton-bar,\s*\.v-pulse \.skeleton-bar \{\s*background: var\(--sk-base\);/);
});

test('Thinking atom: dots default, sheen text with caret, role=status, exported with a demo', () => {
	assert.match(files.Thinking, /variant = 'dots',/);
	assert.match(files.Thinking, /variant\?: 'dots' \| 'sheen';/);
	assert.match(files.Thinking, /label = 'Thinking',/);
	assert.match(files.Thinking, /caret = true,/);
	assert.match(files.Thinking, /role="status"/);
	assert.match(files.Thinking, /data-tsu="Thinking"/);
	assert.match(files.Thinking, /<span class="dots" aria-hidden="true"><span><\/span><span><\/span><span><\/span><\/span>/);
	assert.match(files.Thinking, /\{#if caret\}<span class="caret" aria-hidden="true"><\/span>\{\/if\}/);
	const n = normalize(css.Thinking);
	assert.match(n, /\.dots span {[^}]*background: currentColor; animation: tsu-thinking-dot 1\.2s var\(--ease-in-out\) infinite; }/);
	assert.match(n, /\.text { background: linear-gradient\(90deg, var\(--text-muted\) 0 38%, var\(--text\) 50%, var\(--text-muted\) 62% 100%\);[^}]*background-clip: text; color: transparent; animation: tsu-thinking-sheen 1\.8s linear infinite; }/);
	assert.match(n, /\.caret {[^}]*background: var\(--accent\); animation: tsu-thinking-blink 1s steps\(2, jump-none\) infinite; }/);
	assert.match(n, /@media \(prefers-reduced-motion: reduce\) { \.dots span, \.text, \.caret { animation: none; } \.text { background-position: 50% 0; } }/);
	assert.match(index, /export \{ default as Thinking \} from '\.\/components\/atoms\/Thinking\.svelte';/);
});

test('new rules use theme tokens only and never animate layout', () => {
	for (const [name, re] of Object.entries(NEW_RULES)) {
		const rules = css[name].match(re) ?? [];
		assert.ok(rules.length > 0, name);
		for (const r of rules) {
			assert.doesNotMatch(r.replace(/#000\b/g, ''), /#[0-9a-f]{3,8}\b|rgba?\(|hsl\(/i, `${name}: ${r}`);
		}
	}
	for (const name of Object.keys(files)) {
		const frames = css[name].match(/@keyframes tsu-(spin-(comet|sweep|morph|breath)|progress|skeleton|thinking)[\s\S]*?\n\t}/g) ?? [];
		for (const f of frames) assert.doesNotMatch(f, /\b(width|height|top|left|right|bottom|margin|padding)\s*:/, f.split('\n')[0]);
	}
});

test('demos show the variants', async () => {
	assert.match(await read('demo/atoms/Spinner/02-Variants.svelte'), /'comet', 'breath', 'morph', 'sweep'/);
	assert.match(await read('demo/atoms/Spinner/04-Accent.svelte'), /Spinner \{variant\}/);
	assert.match(await read('demo/atoms/Progress/05-Motion.svelte'), /variant="liquid"[\s\S]*variant="stripes"/);
	assert.match(await read('demo/atoms/Skeleton/04-Motion.svelte'), /const variants = \['sheen', 'pulse'\] as const/);
	assert.match(await read('demo/atoms/Thinking/02-Variants.svelte'), /variant="sheen"/);
});
