import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const dir = new URL('../src/lib/components/atoms/', import.meta.url);
const files = (await readdir(dir)).filter((f) => f.endsWith('.svelte'));
const src = Object.fromEntries(
	await Promise.all(files.map(async (f) => [f.replace('.svelte', ''), await readFile(new URL(f, dir), 'utf8')]))
);

const ALLOWED_LITERALS = {};

test('no atom hardcodes a 1px border from --border / --border-strong', () => {
	for (const [name, s] of Object.entries(src)) {
		const hits = s.match(/1px (?:solid|var\(--card-border-style\)) var\(--border(?:-strong)?\b/g) ?? [];
		assert.equal(hits.length, ALLOWED_LITERALS[name] ?? 0, `${name}: ${hits.join(', ')}`);
	}
});

test('Button reads the button role tokens behind its per-component hooks', () => {
	const s = src.Button;
	assert.equal(s.match(/border: var\(--edge-width\) solid var\(--btn-border, var\(--btn-edge\)\);/g)?.length, 2);
	assert.equal(s.match(/background: var\(--btn-bg, var\(--btn-fill\)\);/g)?.length, 2);
	assert.equal(s.match(/background: var\(--btn-bg, var\(--btn-primary-fill\)\);/g)?.length, 2);
	assert.equal(s.match(/border-color: var\(--btn-border, var\(--btn-primary-edge\)\);/g)?.length, 2);
	assert.match(s, /--btn-shadow-rest: var\(--btn-primary-shadow\);\s*--btn-shadow-lift: var\(--btn-primary-shadow-hover\);/);
	assert.match(s, /box-shadow: var\(--btn-shadow-rest\);/);
	assert.match(s, /\.btn:focus-visible:not\([^)]*\) \{\s*box-shadow: var\(--btn-shadow-rest\), var\(--focus-glow\);/);
	assert.match(
		s,
		/\.btn:hover:not\(:disabled\) \{[^}]*translate: 0 calc\(-1 \* var\(--hover-lift\)\);\s*--btn-shadow-rest: var\(--btn-shadow-lift\);/
	);
	assert.match(s, /translate var\(--dur-fast\) var\(--ease-out\)/);
	assert.doesNotMatch(s, /transition: all/);
});

test('Card paints from the surface tokens and lifts on hover', () => {
	const s = src.Card;
	assert.match(s, /background: var\(--surface-fill\);/);
	assert.match(s, /border: var\(--edge-width\) var\(--card-border-style\) var\(--surface-edge\);/);
	assert.match(s, /border: var\(--edge-width\) var\(--card-border-style\) var\(--stack-border\);/);
	assert.match(s, /border-bottom: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(s, /border-top: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(s, /--card-shadow-rest: var\(--surface-shadow\);\s*box-shadow: var\(--card-shadow-rest\);/);
	assert.match(
		s,
		/\.card-tap:hover \{\s*border-color: var\(--surface-edge-strong\);\s*translate: 0 calc\(-1 \* var\(--hover-lift\)\);\s*--card-shadow-rest: var\(--surface-shadow-hover\);/
	);
});

test('form controls read the control tokens and append the focus glow', () => {
	for (const [name, hook] of [
		['Input', 'input'],
		['Select', 'select'],
		['Textarea', 'textarea']
	]) {
		const s = src[name];
		assert.match(s, new RegExp(`background: var\\(--${hook}-bg, var\\(--control-fill\\)\\);`), name);
		assert.match(
			s,
			new RegExp(`border: var\\(--edge-width\\) solid var\\(--${hook}-border, var\\(--control-edge\\)\\);`),
			name
		);
		assert.match(s, /box-shadow: var\(--control-shadow\);/, name);
		assert.match(s, /box-shadow: var\(--control-shadow\), var\(--focus-glow\);/, name);
		assert.match(s, /border-color: var\(--control-edge-hover\);/, name);
		assert.doesNotMatch(s, /border-color: var\(--text-faint\)/, name);
	}
	assert.match(src.Checkbox, /border: var\(--edge-width\) solid var\(--control-edge\);/);
	assert.match(src.Checkbox, /background: var\(--control-fill\);/);
	assert.match(src.Checkbox, /input:focus-visible \+ \.box \{[^}]*box-shadow: var\(--control-shadow\), var\(--focus-glow\);/);
});

test('tracks and thumbs read the track tokens', () => {
	assert.match(src.Switch, /background: var\(--track-fill\);/);
	assert.match(src.Switch, /\.switch:focus-visible \{[^}]*box-shadow: var\(--focus-glow\);/);
	assert.match(src.Progress, /background: var\(--track-fill\);/);
	assert.equal(src.SegmentedProgress.match(/background: var\(--track-fill\);/g)?.length, 2);
	assert.match(src.Gauge, /border: var\(--edge-width\) solid var\(--track-edge\);/);
	assert.match(src.Gauge, /background: var\(--track-fill\);/);
	assert.match(src.Slider, /var\(--track-fill\) var\(--pct\)/);
	assert.equal(src.Slider.match(/box-shadow: var\(--thumb-shadow\);/g)?.length, 2);
	assert.equal(src.Slider.match(/box-shadow: var\(--thumb-shadow\), var\(--halo\);/g)?.length, 2);
	assert.equal(src.Slider.match(/box-shadow: var\(--thumb-shadow\), var\(--focus-glow\);/g)?.length, 2);
	assert.doesNotMatch(src.Slider, /var\(--shadow-sm\)/);
});

test('Artwork is a surface that lifts on hover', () => {
	assert.match(src.Artwork, /background: var\(--surface-fill-2\);\s*border: var\(--edge-width\) solid var\(--surface-edge\);/);
	assert.match(src.Artwork, /border-color: var\(--surface-edge-strong\);[^}]*translate: 0 calc\(-1 \* var\(--hover-lift\)\);/);
});

test('chip borders take the shared edge width', () => {
	assert.match(src.Badge, /border: var\(--edge-width\) solid var\(--badge-border, var\(--border\)\);/);
	assert.match(src.Kbd, /border: var\(--edge-width\) solid var\(--border-strong\);/);
	assert.match(src.Swatch, /border: var\(--edge-width\) solid var\(--border\);/);
	assert.match(src.Switch, /border: var\(--edge-width\) solid var\(--border-strong\);/);
});
