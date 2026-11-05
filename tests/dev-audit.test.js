import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as esbuild from 'esbuild';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

/** @param {boolean} dev */
async function bundle(dev) {
	const out = await esbuild.build({
		entryPoints: [join(HERE, 'fixtures/dev-audit-entry.js')],
		bundle: true,
		write: false,
		minify: true,
		format: 'iife',
		platform: 'browser',
		define: { 'import.meta.env.DEV': String(dev) }
	});
	return out.outputFiles[0].text;
}

const devBundle = await bundle(true);

/** @param {string} html @param {{ coarse?: boolean }} [opts] */
function setup(html, opts = {}) {
	const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const win = dom.window;
	win.matchMedia = /** @type {any} */ (
		(/** @type {string} */ q) => ({ matches: q.includes('coarse') && !!opts.coarse, addEventListener() {}, removeEventListener() {} })
	);
	/** @type {unknown[][]} */
	const warnings = [];
	win.console.warn = (...args) => warnings.push(args);
	win.eval(devBundle);
	const audit = win.__audit;
	const doc = win.document;
	/** Give an element a measured hit box (jsdom has no layout). */
	const size = (/** @type {string} */ sel, /** @type {number} */ w, /** @type {number} */ h) => {
		const el = doc.querySelector(sel);
		el.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, left: 0, right: w, bottom: h, width: w, height: h, toJSON() {} });
		return el;
	};
	const run = () => Array.from(audit.auditDesign({ root: doc, touchTarget: 44 }));
	const kinds = () => run().map((i) => i.kind);
	return { win, doc, audit, warnings, size, run, kinds };
}

test('two visible primary Buttons in the same main are flagged; one per landmark is not', () => {
	const r = setup(`
		<main>
			<button data-tsu="Button" class="btn btn-primary">Save</button>
			<button data-tsu="Button" class="btn">Cancel</button>
		</main>
		<div role="dialog"><button data-tsu="Button" class="btn btn-primary">Confirm</button></div>`);
	assert.deepEqual(r.kinds(), []);
	r.doc.querySelector('main').insertAdjacentHTML('beforeend', '<button data-tsu="Button" class="btn btn-primary">Publish</button>');
	const issues = r.run();
	assert.deepEqual(issues.map((i) => i.kind), ['multiple-primary']);
	assert.equal(issues[0].el.textContent, 'Publish');
	assert.match(issues[0].message, /2 primary Buttons .* same main/);
});

test('hidden primaries do not count', () => {
	const r = setup(`
		<main>
			<button data-tsu="Button" class="btn btn-primary">Save</button>
			<button data-tsu="Button" class="btn btn-primary" hidden>Later</button>
			<div style="display:none"><button data-tsu="Button" class="btn btn-primary">Ghost</button></div>
		</main>`);
	assert.deepEqual(r.kinds(), []);
});

test('Button/IconButton without an accessible name is flagged; aria-label, text, labelledby and inner alt are names', () => {
	const r = setup(`
		<button data-tsu="IconButton" class="btn btn-icon" aria-label="Close"><svg></svg></button>
		<button data-tsu="Button" class="btn"><span aria-hidden="true">x</span>Delete</button>
		<span id="lbl">Search</span><button data-tsu="Button" class="btn" aria-labelledby="lbl"></button>
		<button data-tsu="Button" class="btn"><img alt="Avatar"></button>
		<button data-tsu="IconButton" class="btn btn-icon" id="bad"><svg></svg></button>
		<button data-tsu="Button" class="btn" id="bad2"><span aria-hidden="true">only hidden</span></button>`);
	const issues = r.run();
	assert.deepEqual(issues.map((i) => i.el.id), ['bad', 'bad2']);
	assert.deepEqual([...new Set(issues.map((i) => i.kind))], ['unnamed-control']);
	assert.match(issues[0].message, /<IconButton> has no accessible name/);
});

test('on a coarse pointer, interactive elements under --touch-target are flagged', () => {
	const r = setup(
		`<main>
			<button id="small">A</button>
			<a id="link" href="/x">B</a>
			<button id="ok">C</button>
			<label id="wrap"><input id="boxed" type="checkbox"> Opt</label>
		</main>`,
		{ coarse: true }
	);
	r.size('#small', 30, 30);
	r.size('#link', 100, 20);
	r.size('#ok', 44, 44);
	r.size('#boxed', 16, 16);
	r.size('#wrap', 120, 48);
	const issues = r.run();
	assert.deepEqual(issues.map((i) => i.el.id), ['small', 'link']);
	assert.match(issues[0].message, /30x30px, under the 44px touch target/);
});

test('coarse-pointer sizing accepts kit controls at --touch-target-compact and skips fine pointers, .hit-compact, disabled and slab-extended controls', () => {
	const kit = setup('<button id="md" data-tsu="Button" class="btn">A</button><button id="plain">B</button>', { coarse: true });
	kit.size('#md', 50, 40);
	kit.size('#plain', 50, 40);
	assert.deepEqual(kit.run().map((i) => i.el.id), ['plain']);

	const fine = setup('<button id="small">A</button>');
	fine.size('#small', 20, 20);
	assert.deepEqual(fine.kinds(), []);

	const r = setup(
		`<button id="compact" class="hit-compact">A</button>
		 <button id="off" disabled>B</button>
		 <button id="slab" class="btn btn-sm">C</button>
		 <button id="after" class="btn btn-icon" aria-label="D"></button>`,
		{ coarse: true }
	);
	for (const id of ['compact', 'off', 'slab', 'after']) r.size(`#${id}`, 28, 28);
	const real = r.win.getComputedStyle.bind(r.win);
	r.win.getComputedStyle = (el, pseudo) => {
		if (el.id === 'slab' && pseudo === '::before') return { position: 'absolute', content: '""' };
		if (el.id === 'after' && pseudo === '::after') return { position: 'absolute', content: '""' };
		if (pseudo) return { position: 'static', content: 'none' };
		return real(el);
	};
	assert.deepEqual(r.kinds(), []);
});

test('text inside an Artwork or over an img without a Scrim is flagged', () => {
	const r = setup(`
		<div data-tsu="Artwork"><img src="a.png" alt=""><span id="caption">Album</span></div>
		<div data-tsu="Artwork"><span class="initials" aria-hidden="true">AB</span></div>
		<div data-tsu="Artwork"><img src="a.png" alt=""><div data-tsu="Scrim"></div><span>Covered</span></div>
		<div data-tsu="Artwork"><img src="a.png" alt=""><span style="background: rgba(0,0,0,.5)">Tinted</span></div>
		<div style="position:relative"><img src="b.png" alt=""><h2 id="hero" style="position:absolute">Hero</h2></div>
		<div style="position:relative"><img src="b.png" alt=""><div class="scrim"></div><h2 style="position:absolute">Safe hero</h2></div>
		<figure><img src="c.png" alt=""><figcaption>Below, not over</figcaption></figure>`);
	const issues = r.run();
	assert.deepEqual(issues.map((i) => i.el.id), ['caption', 'hero']);
	assert.deepEqual([...new Set(issues.map((i) => i.kind))], ['text-over-image']);
	assert.match(issues[0].message, /text sits on an image without a Scrim/);
});

test('a clean page produces no issues', () => {
	const r = setup(
		`<main>
			<button data-tsu="Button" class="btn btn-primary" id="p">Save</button>
			<button data-tsu="IconButton" class="btn btn-icon" aria-label="Menu" id="m"></button>
			<a href="/x" id="a">Link</a>
		</main>`,
		{ coarse: true }
	);
	for (const id of ['p', 'm', 'a']) r.size(`#${id}`, 48, 48);
	assert.deepEqual(r.kinds(), []);
});

test('startDesignAudit warns once per issue with the "[tsumikit]" prefix and the element, debounced after mutations', async () => {
	const r = setup('<main><button data-tsu="Button" class="btn btn-primary">Save</button></main>');
	const stop = r.audit.startDesignAudit({ root: r.doc, delay: 5 });
	const tick = () => new Promise((res) => setTimeout(res, 40));
	await tick();
	assert.equal(r.warnings.length, 0);

	const main = r.doc.querySelector('main');
	main.insertAdjacentHTML('beforeend', '<button data-tsu="Button" class="btn btn-primary" id="dup">Publish</button>');
	main.insertAdjacentHTML('beforeend', '<button data-tsu="IconButton" class="btn btn-icon" id="nameless"></button>');
	await tick();
	assert.equal(r.warnings.length, 2);
	assert.match(String(r.warnings[0][0]), /^\[tsumikit\] 2 primary Buttons/);
	assert.equal(r.warnings[0][1], r.doc.getElementById('dup'));
	assert.equal(r.warnings[1][1], r.doc.getElementById('nameless'));

	main.setAttribute('data-touched', '1');
	await tick();
	assert.equal(r.warnings.length, 2);

	stop();
	main.insertAdjacentHTML('beforeend', '<button data-tsu="IconButton" class="btn btn-icon"></button>');
	await tick();
	assert.equal(r.warnings.length, 2);
});

test('with DEV false the audit body is dead code and AppShell bundles without it', async () => {
	const prod = await bundle(false);
	assert.ok(devBundle.includes('primary Buttons'));
	assert.ok(!prod.includes('MutationObserver'));
	assert.doesNotMatch(prod, /DEV/);
	const appShell = await buildFixture('mount-app-shell.svelte.js');
	assert.ok(appShell.includes('onSidebarClick'));
	assert.ok(!appShell.includes('primary Buttons'));
	assert.ok(!appShell.includes('reportDesignIssues'));
});
