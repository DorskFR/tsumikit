import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { BREAKPOINTS, isAllowedBreakpointWidth } from '../lint/breakpoints.mjs';
import { breakpoints, breakpointsPx, maxWidth, minWidth } from '../src/lib/breakpoints';
import { buildFixture } from './fixtures/build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (/** @type {string} */ p) => readFile(join(ROOT, p), 'utf8');

test('lint/breakpoints.mjs and src/lib/breakpoints.ts publish the same list', () => {
	assert.deepEqual(
		BREAKPOINTS.map((b) => [b.name, b.rem, b.px]),
		Object.entries(breakpoints).map(([name, rem]) => [name, rem, breakpointsPx[/** @type {keyof typeof breakpointsPx} */ (name)]])
	);
	assert.deepEqual(breakpoints, { sm: 40, md: 48, lg: 64 });
});

test('minWidth / maxWidth build the contract forms the lint rule accepts', () => {
	assert.equal(minWidth('md'), '(min-width: 48rem)');
	assert.equal(maxWidth('md'), '(max-width: 47.999rem)');
	assert.equal(maxWidth('sm'), '(max-width: 39.999rem)');
	assert.equal(maxWidth('lg'), '(max-width: 63.999rem)');
	for (const bp of /** @type {const} */ (['sm', 'md', 'lg'])) {
		for (const q of [minWidth(bp), maxWidth(bp)]) assert.ok(isAllowedBreakpointWidth(/** @type {RegExpMatchArray} */ (q.match(/: (.+)\)/))[1]), q);
	}
});

/** @param {string} dir @returns {Promise<string[]>} */
async function walk(dir) {
	const out = [];
	for (const d of await readdir(dir, { withFileTypes: true })) {
		const p = join(dir, d.name);
		if (d.isDirectory()) out.push(...(await walk(p)));
		else if (/\.(svelte|css)$/.test(d.name)) out.push(p);
	}
	return out;
}

test('every width @media in src/lib is on the list', async () => {
	const offenders = [];
	let widths = 0;
	for (const file of await walk(join(ROOT, 'src/lib'))) {
		const src = await readFile(file, 'utf8');
		for (const m of src.matchAll(/@media[^{]*/g)) {
			for (const w of m[0].matchAll(/(?:min|max)-width:\s*([^)]+)\)/g)) {
				widths++;
				if (!isAllowedBreakpointWidth(w[1])) offenders.push(`${file.slice(ROOT.length)}: ${w[0]}`);
			}
		}
	}
	assert.ok(widths >= 10, `${widths} width queries`);
	assert.deepEqual(offenders, []);
});

test('px widths are gone from the kit: Modal is on 40rem', async () => {
	const modal = await read('src/lib/components/molecules/Modal.svelte');
	assert.doesNotMatch(modal, /@media \(min-width: 640px\)/);
	assert.ok((modal.match(/@media \(min-width: 40rem\)/g) ?? []).length >= 3);
});

test('index.ts exports breakpoints, media and mq', async () => {
	const index = await read('src/lib/index.ts');
	assert.match(index, /export \{ type Breakpoint, breakpoints, breakpointsPx, maxWidth, minWidth \} from '\.\/breakpoints';/);
	assert.match(index, /export \{ type Media, media, mq \} from '\.\/media\.svelte';/);
});

test('mq and media() track matchMedia and update reactively', async () => {
	const bundle = await buildFixture('mount-media.svelte.js');
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const w = dom.window;
	/** @type {Map<string, EventTarget>} */
	const queries = new Map();
	let width = 800;
	const rem = (/** @type {string} */ q) => Number(/** @type {RegExpMatchArray} */ (q.match(/min-width: ([\d.]+)rem/))[1]) * 16;
	w.matchMedia = (/** @type {string} */ q) => {
		let mql = queries.get(q);
		if (!mql) {
			mql = new w.EventTarget();
			Object.defineProperties(mql, {
				media: { value: q },
				matches: { get: () => width >= rem(q) }
			});
			queries.set(q, mql);
		}
		return /** @type {MediaQueryList} */ (/** @type {unknown} */ (mql));
	};
	const resize = (/** @type {number} */ px) => {
		width = px;
		for (const mql of queries.values()) mql.dispatchEvent(new w.Event('change'));
	};
	w.eval(bundle);
	const { mount, unmount, flushSync, Fixture } = w.__fixture;
	const app = mount(Fixture, { target: w.document.body });
	flushSync();
	const part = (/** @type {string} */ n) => /** @type {HTMLElement} */ (w.document.querySelector(`[data-part="${n}"]`)).getAttribute('data-matches');
	assert.deepEqual([part('md'), part('mq-sm'), part('mq-lg')], ['true', 'true', 'false']);
	assert.deepEqual([...queries.keys()].sort(), ['(min-width: 40rem)', '(min-width: 48rem)', '(min-width: 64rem)']);
	resize(500);
	flushSync();
	assert.deepEqual([part('md'), part('mq-sm'), part('mq-lg')], ['false', 'false', 'false']);
	resize(1200);
	flushSync();
	assert.deepEqual([part('md'), part('mq-sm'), part('mq-lg')], ['true', 'true', 'true']);
	unmount(app);
});
