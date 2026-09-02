import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [component, css] = await Promise.all([
	readFile(new URL('../src/lib/components/layouts/Container.svelte', import.meta.url), 'utf8'),
	readFile(new URL('../src/lib/styles/utilities.css', import.meta.url), 'utf8')
]);

test('defaults keep the centered --content-max column with --sp-4 safe-area gutters', () => {
	assert.match(component, /align = 'center'/);
	assert.match(component, /pad = false/);
	assert.match(component, /fullWidth = false/);
	assert.match(component, /\.ct\s*{[^}]*--container-gutter: var\(--sp-4\);/);
	assert.match(component, /\.ct\s*{[^}]*max-width: var\(--ct-max, var\(--content-max\)\);/);
	assert.match(component, /\.ct\s*{[^}]*margin-inline: auto;/);
	assert.match(
		component,
		/padding-inline: max\(var\(--container-gutter\), var\(--safe-left\)\)\s*max\(var\(--container-gutter\), var\(--safe-right\)\);/
	);
});

test('component is self-contained but still carries the .container hook for consumer overrides', () => {
	assert.match(component, /class="container ct {klass}"/);
	assert.match(css, /\.container\s*{[^}]*max-width: var\(--content-max\);/);
	assert.doesNotMatch(css, /\.container\s*{[^}]*padding-inline: var\(--sp-4\);\s*padding-left/);
});

test('size accepts a length or "none"', () => {
	assert.match(component, /size\?: string \| 'none'/);
	assert.match(component, /if \(!fullWidth && size && size !== 'none'\) vars\.push\(`--ct-max: \${size}`\)/);
	assert.match(component, /class:none={size === 'none'}/);
	assert.match(component, /\.ct\.none\s*{\s*max-width: none;\s*}/);
});

test('gutter sets --container-gutter so children can bleed with the same variable', () => {
	assert.match(component, /gutter\?: string/);
	assert.match(component, /if \(gutter\) vars\.push\(`--container-gutter: \${gutter}`\)/);
});

test('align="start" drops the centering', () => {
	assert.match(component, /align\?: 'center' \| 'start'/);
	assert.match(component, /class:start={align === 'start'}/);
	assert.match(component, /\.ct\.start\s*{\s*margin-inline: 0;\s*}/);
});

test('fullWidth stays a viewport breakout, optionally inset for docked panels', () => {
	assert.match(component, /class:full={fullWidth}/);
	assert.match(component, /inset\?: string/);
	assert.match(component, /const \[left, right = left\] = inset\.trim\(\)\.split\(\/\\s\+\/\)/);
	assert.match(component, /\.ct\.full\s*{[^}]*--ct-inset-l: 0px;/);
	assert.match(component, /width: calc\(100vw - var\(--ct-inset-l\) - var\(--ct-inset-r\)\);/);
	assert.match(
		component,
		/margin-inline: calc\(50% - 50vw \+ var\(--ct-inset-l\)\) calc\(50% - 50vw \+ var\(--ct-inset-r\)\);/
	);
});
