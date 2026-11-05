import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { hasDecl, normalize } from './helpers.mjs';

/** @param {string} p */
const read = (p) => readFile(new URL(`../${p}`, import.meta.url), 'utf8');
const [tokens, font, app, license, pkg] = await Promise.all([
	read('src/lib/styles/tokens.css'),
	read('src/lib/styles/font.css'),
	read('src/lib/styles/app.css'),
	read('src/lib/styles/fonts/LICENSE-Inter.txt'),
	read('package.json').then(JSON.parse)
]);
/** @param {string} p */
const css = async (p) => {
	const src = await read(`src/lib/components/${p}`);
	return normalize(src.slice(src.indexOf('<style>')));
};

test('Inter is bundled as a variable woff2 with its OFL licence beside it', async () => {
	const woff2 = await readFile(new URL('../src/lib/styles/fonts/inter.woff2', import.meta.url));
	assert.equal(woff2.subarray(0, 4).toString('latin1'), 'wOF2');
	assert.ok(woff2.byteLength < 80_000, `latin subset only: ${woff2.byteLength} bytes`);
	assert.match(license, /SIL Open Font License, Version 1\.1/);
	assert.match(license, /Copyright \(c\) 2016 The Inter Project Authors/);
});

test('font.css declares one swap-display variable @font-face with a relative url', () => {
	const face = normalize(font.match(/@font-face {([^}]*)}/)?.[1] ?? '');
	assert.match(face, /font-family: "Inter";/);
	assert.match(face, /font-weight: 100 900;/);
	assert.match(face, /font-display: swap;/);
	assert.match(face, /src: url\("\.\/fonts\/inter\.woff2"\) format\("woff2"\);/);
	assert.doesNotMatch(font, /https?:\/\//, 'no CDN');
	assert.match(normalize(font), /:where\(body\) { font-feature-settings: "cv11", "ss01"; }/);
});

test('app.css loads font.css ahead of the tokens; tokens.css lists Inter first in --font-sans', () => {
	const imports = [...app.matchAll(/@import '\.\/([a-z]+\.css)';/g)].map((m) => m[1]);
	assert.equal(imports[0], 'font.css');
	assert.ok(imports.indexOf('font.css') < imports.indexOf('variables.css'));
	assert.match(tokens, /^  --font-sans:\s*\n?\s*"Inter", ui-sans-serif, system-ui/m);
	assert.doesNotMatch(tokens, /@font-face|@import/);
});

test('numbers and labels default to the sans; only code slots keep mono', async () => {
	assert.match(tokens, /^  --font-numeric: var\(--font-sans\);/m);
	assert.match(tokens, /^  --font-label: var\(--font-sans\);/m);
	assert.match(tokens, /--font-numeric: var\(--font-mono\)/, 'the revert is documented next to the token');
	for (const p of ['molecules/Metric.svelte', 'atoms/Badge.svelte', 'layouts/NavSection.svelte', 'atoms/Button.svelte']) {
		assert.doesNotMatch(await css(p), /var\(--font-mono\)/, p);
	}
	for (const p of ['atoms/Kbd.svelte', 'molecules/CodeBlock.svelte', 'molecules/GitRef.svelte']) {
		assert.match(await css(p), /var\(--font-mono\)/, p);
	}
	const text = await css('atoms/Text.svelte');
	assert.ok(hasDecl(text, '.v-code', 'font-family', 'var(--font-mono)'));
	assert.ok(hasDecl(text, '.numeric', 'font-variant-numeric', 'tabular-nums'));
});

test('the font ships in the package next to the stylesheets', async () => {
	assert.ok(pkg.files.includes('dist'));
	assert.equal(pkg.exports['./styles/app.css'], './dist/styles/app.css');
	await stat(new URL('../src/lib/styles/fonts/inter.woff2', import.meta.url));
});
