import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const rel = (/** @type {URL} */ url) => relative(fileURLToPath(root), fileURLToPath(url));

/**
 * The only custom properties a component, a library module or a look selector may declare or read
 * besides the root tokens. Categories (docs/MIGRATION-0.94.md):
 * A: a registered `@property` (inherits: false) animated to drive a gradient angle or stop.
 * B: a runtime value read where an inline style cannot reach (a pseudo-element, a range track,
 *    `@starting-style`, `@keyframes`).
 * C: a page-layout signal published on `<html>` (or the sticky parent) and read like a root token.
 */
const ALLOW = [
	{ name: '--card-glow', category: 'A', files: ['src/lib/components/atoms/Card.svelte'] },
	{ name: '--card-orbit', category: 'A', files: ['src/lib/components/atoms/Card.svelte'] },
	{ name: '--link-mark', category: 'A', files: ['src/lib/components/atoms/Link.svelte'] },
	{ name: '--tsu-spin-arc', category: 'A', files: ['src/lib/components/atoms/Spinner.svelte'] },
	{ name: '--tsu-spin-sweep', category: 'A', files: ['src/lib/components/atoms/Spinner.svelte'] },
	{ name: '--stack-x', category: 'B', files: ['src/lib/components/atoms/Card.svelte'] },
	{ name: '--stack-y', category: 'B', files: ['src/lib/components/atoms/Card.svelte'] },
	{ name: '--pointer-x', category: 'B', files: ['src/lib/components/atoms/Card.svelte', 'src/lib/pointer.ts'] },
	{ name: '--pointer-y', category: 'B', files: ['src/lib/components/atoms/Card.svelte', 'src/lib/pointer.ts'] },
	{ name: '--pct', category: 'B', files: ['src/lib/components/atoms/Slider.svelte'] },
	{ name: '--fill', category: 'B', files: ['src/lib/components/atoms/Progress.svelte'] },
	{ name: '--cap', category: 'B', files: ['src/lib/components/molecules/CapBar.svelte'] },
	{ name: '--ink-x', category: 'B', files: ['src/lib/components/molecules/Tabs.svelte'] },
	{ name: '--ink-y', category: 'B', files: ['src/lib/components/molecules/Tabs.svelte'] },
	{
		name: '--tsu-shift',
		category: 'B',
		files: [
			'src/lib/components/molecules/Popover.svelte',
			'src/lib/components/molecules/Combobox.svelte',
			'src/lib/floating.ts'
		]
	},
	{ name: '--section-header-h', category: 'C', files: ['src/lib/components/molecules/SectionHeader.svelte'] },
	{
		name: '--tabbar-h',
		category: 'C',
		files: [
			'src/lib/components/layouts/TabBar.svelte',
			'src/lib/components/molecules/Toaster.svelte',
			'src/lib/components/organisms/DataTable.svelte'
		]
	},
	{
		name: '--selectionbar-h',
		category: 'C',
		files: ['src/lib/components/organisms/DataTable.svelte', 'src/lib/components/molecules/Toaster.svelte']
	},
	{ name: '--toaster-offset', category: 'C', files: ['src/lib/components/molecules/Toaster.svelte'] },
	{ name: '--toaster-offset-top', category: 'C', files: ['src/lib/components/molecules/Toaster.svelte'] },
	{ name: '--sticky-offset', category: 'C', files: ['src/lib/components/molecules/SectionHeader.svelte'] },
	{ name: '--fs-scale', category: 'C', files: ['src/lib/stores/fontscale.svelte.ts'] }
];

const NAME = '--[a-zA-Z_][\\w-]*';

/**
 * @param {URL} dir
 * @param {(name: string) => boolean} keep
 * @param {URL[]} [out]
 * @returns {Promise<URL[]>}
 */
async function walk(dir, keep, out = []) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const url = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, dir);
		if (entry.isDirectory()) await walk(url, keep, out);
		else if (keep(entry.name)) out.push(url);
	}
	return out;
}

/**
 * @param {string} src
 * @param {RegExp[]} patterns
 */
function blank(src, patterns) {
	let out = src;
	for (const re of patterns) out = out.replace(re, (m) => m.replace(/[^\n]/g, ' '));
	return out;
}
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const LINE_COMMENT = /(?<![:'"`\w])\/\/[^\n]*/g;

const lineOf = (/** @type {string} */ src, /** @type {number} */ index) => src.slice(0, index).split('\n').length;

/** @typedef {{ name: string, line: number, kind: string }} Hit */
/** @typedef {{ prelude: string, body: string, index: number, wrappers: string[] }} Rule */

/**
 * @param {string} src
 * @param {RegExp} re
 * @param {string} kind
 * @returns {Hit[]}
 */
function hits(src, re, kind) {
	return [...src.matchAll(re)].map((m) => ({ name: m[1], line: lineOf(src, m.index), kind }));
}

const declarations = (/** @type {string} */ src) => [
	...hits(src, new RegExp(`(?<![\\w-])(${NAME})\\s*:`, 'g'), 'declares'),
	...hits(src, new RegExp(`@property\\s+(${NAME})`, 'g'), 'registers')
];
const reads = (/** @type {string} */ src) => hits(src, new RegExp(`var\\(\\s*(${NAME})\\s*[,)]`, 'g'), 'reads');
const fallbackReads = (/** @type {string} */ src) => hits(src, new RegExp(`var\\(\\s*(${NAME})\\s*,`, 'g'), 'reads with a fallback');
const scriptNames = (/** @type {string} */ src) => hits(src, new RegExp(`['"\`](${NAME})['"\`]`, 'g'), 'names');

/**
 * @param {string} css
 * @param {number} [base]
 * @param {string[]} [wrappers]
 * @returns {Rule[]}
 */
function rules(css, base = 0, wrappers = []) {
	/** @type {Rule[]} */
	const out = [];
	let i = 0;
	while (i < css.length) {
		const open = css.indexOf('{', i);
		if (open === -1) break;
		let depth = 1;
		let close = open + 1;
		for (; close < css.length && depth > 0; close++) {
			if (css[close] === '{') depth++;
			else if (css[close] === '}') depth--;
		}
		const prelude = css.slice(i, open).trim();
		const body = css.slice(open + 1, close - 1);
		if (/^@(media|supports|layer|container|scope)\b/.test(prelude)) {
			out.push(...rules(body, base + open + 1, [...wrappers, prelude]));
		} else {
			out.push({ prelude, body, index: base + open + 1, wrappers });
		}
		i = close;
	}
	return out;
}

const isRootSelector = (/** @type {string} */ prelude) =>
	prelude.split(',').every((selector) => /^(:root|html)(\[[^\]]+\])*$/.test(selector.trim()));

const stylesDir = new URL('src/lib/styles/', root);
const looksDir = new URL('src/lib/looks/', root);
const rootTokens = new Set();
for (const file of ['tokens.css', 'themes.css']) {
	const css = blank(await readFile(new URL(file, stylesDir), 'utf8'), [CSS_COMMENT]);
	for (const { name } of declarations(css)) rootTokens.add(name);
}

const looks = [];
for (const url of await walk(looksDir, (name) => name.endsWith('.css'))) {
	const css = blank(await readFile(url, 'utf8'), [CSS_COMMENT]);
	const parsed = rules(css);
	for (const { prelude, body } of parsed) {
		if (isRootSelector(prelude)) for (const { name } of declarations(body)) rootTokens.add(name);
	}
	looks.push({ file: rel(url), css, parsed });
}

const READS = new Set(['reads', 'reads with a fallback', 'names']);
const allowed = (/** @type {string} */ name, /** @type {string} */ file) => ALLOW.some((entry) => entry.name === name && entry.files.includes(file));
const used = new Set();
const note = (/** @type {string} */ name, /** @type {string} */ file) => used.add(`${name} ${file}`);

/**
 * @param {string} file
 * @param {Hit[]} found
 * @param {string[]} findings
 */
function judge(file, found, findings) {
	for (const { name, line, kind } of found) {
		if (allowed(name, file)) {
			note(name, file);
			continue;
		}
		if (READS.has(kind) && rootTokens.has(name)) continue;
		findings.push(`${file}:${line} ${kind} ${name}`);
	}
}

/** @type {string[]} */
const componentFindings = [];
const components = await walk(new URL('src/lib/components/', root), (name) => name.endsWith('.svelte'));
for (const url of components) {
	const file = rel(url);
	const src = blank(await readFile(url, 'utf8'), [CSS_COMMENT, HTML_COMMENT, LINE_COMMENT]);
	judge(
		file,
		[
			...declarations(src),
			...reads(src),
			...hits(src, new RegExp(`style:(${NAME})`, 'g'), 'sets'),
			...hits(src, new RegExp(`setProperty\\(\\s*['"\`](${NAME})`, 'g'), 'sets')
		],
		componentFindings
	);
}

/** @type {string[]} */
const moduleFindings = [];
const modules = await walk(
	new URL('src/lib/', root),
	(name) => /\.(ts|js)$/.test(name) && !name.endsWith('.d.ts') && !name.endsWith('.test.js')
);
for (const url of modules) {
	const file = rel(url);
	const src = blank(await readFile(url, 'utf8'), [CSS_COMMENT, LINE_COMMENT]);
	judge(file, [...scriptNames(src), ...declarations(src), ...reads(src)], moduleFindings);
}

/** @type {string[]} */
const lookFindings = [];
const runtime = new Set(ALLOW.filter((entry) => entry.category !== 'A').map((entry) => entry.name));
for (const { file, css, parsed } of looks) {
	const registered = new Set(
		parsed.filter((r) => /^@property\b/.test(r.prelude)).map((r) => r.prelude.replace(/^@property\s+/, ''))
	);
	for (const { prelude, body, index } of parsed) {
		const at = (/** @type {Hit[]} */ found) => found.map((hit) => ({ ...hit, line: lineOf(css, index) + hit.line - 1 }));
		if (/^@property\b/.test(prelude)) {
			if (!/inherits:\s*false/.test(body)) lookFindings.push(`${file}:${lineOf(css, index)} ${prelude} inherits`);
			continue;
		}
		const found = isRootSelector(prelude) ? fallbackReads(body) : [...declarations(body), ...reads(body)];
		judge(
			file,
			at(found).filter((hit) => !registered.has(hit.name) && !(READS.has(hit.kind) && runtime.has(hit.name))),
			lookFindings
		);
	}
}

test('the allowlist names only variables that are not root tokens', () => {
	const clash = ALLOW.filter((entry) => entry.category !== 'C' && rootTokens.has(entry.name)).map((e) => e.name);
	assert.deepEqual(clash, []);
	assert.ok(rootTokens.has('--accent') && rootTokens.has('--sp-2') && rootTokens.has('--control-md'));
	assert.ok(components.length > 100, 'the component scan found the tree');
});

test('components declare and read no custom property outside the allowlist', () => {
	assert.deepEqual(componentFindings, []);
});

test('library modules name no custom property outside the root tokens and the allowlist', () => {
	assert.deepEqual(moduleFindings, []);
});

test('looks declare custom properties only on :root[data-look] and read only root tokens, runtime values and their own registered properties', () => {
	assert.deepEqual(lookFindings, []);
});

test('every allowlist entry is still in the tree', () => {
	const stale = ALLOW.flatMap((entry) =>
		entry.files.filter((file) => !used.has(`${entry.name} ${file}`)).map((file) => `${entry.name} ${file}`)
	);
	assert.deepEqual(stale, []);
});

test('every category A variable is registered with inherits: false, and nothing else is registered', async () => {
	const registered = [];
	for (const url of components) {
		const src = blank(await readFile(url, 'utf8'), [CSS_COMMENT, HTML_COMMENT]);
		for (const m of src.matchAll(new RegExp(`@property\\s+(${NAME})\\s*\\{([^}]*)\\}`, 'g'))) {
			assert.match(m[2], /inherits:\s*false/, `${rel(url)}: ${m[1]} must not inherit`);
			registered.push(m[1]);
		}
	}
	assert.deepEqual(
		registered.sort(),
		ALLOW.filter((entry) => entry.category === 'A')
			.map((entry) => entry.name)
			.sort()
	);
});

test('the scanner catches each form of declaration and read', () => {
	const sample = [
		'<div style:--a={x} style="--b: 1px"></div>',
		'<script>el.style.setProperty("--c", v); const s = `--d:${v}px`;</script>',
		'<style>.x { --e: 1; color: var(--f, red); width: var(--g); transition: --h 1s; }',
		'@property --i { syntax: "<angle>"; inherits: false; initial-value: 0deg; }',
		'/* --j: 1 */</style>'
	].join('\n');
	const src = blank(sample, [CSS_COMMENT, HTML_COMMENT, LINE_COMMENT]);
	const found = [
		...declarations(src),
		...reads(src),
		...hits(src, new RegExp(`style:(${NAME})`, 'g'), 'sets'),
		...hits(src, new RegExp(`setProperty\\(\\s*['"\`](${NAME})`, 'g'), 'sets')
	].map((hit) => hit.name);
	assert.deepEqual([...new Set(found)].sort(), ['--a', '--b', '--c', '--d', '--e', '--f', '--g', '--i']);
	assert.deepEqual(
		rules(':root[data-look="x"] { --k: 1 } @media (x) { :root[data-look="x"] .y { --l: 1 } }').map((r) =>
			isRootSelector(r.prelude)
		),
		[true, false]
	);
});
