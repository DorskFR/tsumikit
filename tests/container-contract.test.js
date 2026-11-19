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
	assert.match(component, /\.ct\s*{[^}]*max-width: var\(--content-max\);/);
	assert.match(component, /\.ct\s*{[^}]*margin-inline: auto;/);
	assert.match(
		component,
		/padding-inline: max\(var\(--sp-4\), var\(--safe-left\)\) max\(var\(--sp-4\), var\(--safe-right\)\);/
	);
});

test('component is self-contained but still carries the .container hook for consumer overrides', () => {
	assert.match(component, /class="container ct {klass}"/);
	assert.match(css, /\.container\s*{[^}]*max-width: var\(--content-max\);/);
	assert.doesNotMatch(css, /\.container\s*{[^}]*padding-inline: var\(--sp-4\);\s*padding-left/);
});

test('size accepts a length or "none"', () => {
	assert.match(component, /size\?: string \| 'none'/);
	assert.match(component, /if \(!fullWidth && size && size !== 'none'\) decls\.push\(`max-width: \${size}`\)/);
	assert.match(component, /class:none={size === 'none'}/);
	assert.match(component, /\.ct\.none\s*{\s*max-width: none;\s*}/);
});

test('gutter sets the inline padding, safe-area insets still winning when larger', () => {
	assert.match(component, /gutter\?: string/);
	assert.match(
		component,
		/decls\.push\(`padding-inline: max\(\${gutter}, var\(--safe-left\)\) max\(\${gutter}, var\(--safe-right\)\)`\)/
	);
	assert.doesNotMatch(component, /--container-gutter|--ct-/);
});

test('align="start" drops the centering', () => {
	assert.match(component, /align\?: 'center' \| 'start'/);
	assert.match(component, /class:start={align === 'start'}/);
	assert.match(component, /\.ct\.start\s*{\s*margin-inline: 0;\s*}/);
});

test('fullWidth stays a viewport breakout, optionally inset for docked panels', () => {
	assert.match(component, /class:full={fullWidth}/);
	assert.match(component, /inset\?: string/);
	assert.match(component, /const \[left, right = left\] = \(inset \?\? '0px'\)\.trim\(\)\.split\(\/\\s\+\/\)/);
	assert.match(component, /\.ct\.full\s*{\s*max-width: none;\s*width: 100vw;\s*margin-inline: calc\(50% - 50vw\);/);
	assert.match(component, /`width: calc\(\${vw} - \${left} - \${right}\)`/);
	assert.match(
		component,
		/`margin-inline: calc\(50% - \${vw} \/ 2 \+ \${left}\) calc\(50% - \${vw} \/ 2 \+ \${right}\)`/
	);
});
