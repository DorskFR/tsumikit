/**
 * Verify the built ds-bundle: load it exactly as a preview card does
 * (vendored React globals, then _ds_bundle.js) and render every export.
 *
 *   node .design-sync/verify-bundle.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const OUT = fileURLToPath(new URL('../ds-bundle/', import.meta.url));
const cardProps = JSON.parse(readFileSync(new URL('./card-props.json', import.meta.url), 'utf8'));

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true, url: 'http://localhost/' });
const W = dom.window;
for (const k of Object.getOwnPropertyNames(W)) {
	if (k in globalThis && !['window', 'document'].includes(k)) continue;
	try { globalThis[k] = W[k]; } catch {}
}
globalThis.window = W;
globalThis.document = W.document;

// Browser APIs the real design runtime has and jsdom lacks.
W.matchMedia ||= (q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
W.ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} };
W.IntersectionObserver ||= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
W.scrollTo ||= () => {};
if (!W.Element.prototype.scrollIntoView) W.Element.prototype.scrollIntoView = function () {};
if (!W.HTMLElement.prototype.animate) W.HTMLElement.prototype.animate = () => ({ finished: Promise.resolve(), cancel() {}, finish() {} });
if (!W.HTMLElement.prototype.showModal) {
	W.HTMLElement.prototype.showModal = function () { this.open = true; };
	W.HTMLElement.prototype.close = function () { this.open = false; };
}
for (const m of ['addEventListener', 'removeEventListener', 'dispatchEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'matchMedia', 'scrollTo'])
	if (typeof W[m] === 'function') globalThis[m] = W[m].bind(W);
globalThis.ResizeObserver = W.ResizeObserver;
globalThis.IntersectionObserver = W.IntersectionObserver;
console.error = () => {};
console.warn = () => {};

// Load in card order. These are IIFEs that publish onto `window`.
for (const f of ['_vendor/react.js', '_vendor/react-dom.js', '_ds_bundle.js']) {
	new Function(readFileSync(join(OUT, f), 'utf8'))();
}

const log = (...a) => process.stdout.write(`${a.join(' ')}\n`);
const NS = W.Tsumikit_a4c6ce;
if (!NS) { log('FATAL: window.Tsumikit_a4c6ce missing'); process.exit(1); }
const React = W.React;
const ReactDOM = W.ReactDOM;
const names = Object.keys(NS).filter((k) => /^[A-Z]/.test(k));
log(`React: ${React.version} | createRoot: ${typeof ReactDOM.createRoot} | exports: ${names.length}`);

const fails = [];
let cells = 0;
for (const name of names) {
	const card = cardProps[name] ?? {};
	const variants = card.variants ?? [card];
	for (const [i, v] of variants.entries()) {
		const cfg = { ...card, ...v };
		const tag = variants.length > 1 ? `${name}[${cfg.label || i}]` : name;
		const host = W.document.createElement('div');
		W.document.body.appendChild(host);
		try {
			const root = ReactDOM.createRoot(host);
			const props = cfg.propsExpr ? new Function('Tsumikit_a4c6ce', 'React', `return (${cfg.propsExpr})`)(NS, React) : (cfg.props ?? {});
			root.render(React.createElement(NS[name], props, cfg.children ?? name));
			// let the concurrent render commit and effects (which mount Svelte) run
			for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 10));
			const rendered = host.innerHTML.replace(/<!---->/g, '').replace(/<span style="display: contents;"><\/span>/g, '').trim();
			if (!rendered) fails.push([tag, 'rendered EMPTY']);
		} catch (e) {
			fails.push([tag, e.message]);
		}
		cells++;
		host.remove();
	}
}
log(`rendered OK: ${cells - fails.length}/${cells} cells across ${names.length} exports`);
if (fails.length) { log('FAILURES:'); for (const [n, e] of fails) log(`  ${n.padEnd(20)} ${e}`); }

const dirs = [];
for (const g of readdirSync(join(OUT, 'components'))) for (const n of readdirSync(join(OUT, 'components', g))) dirs.push([g, n]);
const badCards = dirs.filter(([g, n]) => !readFileSync(join(OUT, 'components', g, n, `${n}.html`), 'utf8').startsWith('<!-- @dsCard '));
log(`component dirs: ${dirs.length} | cards with @dsCard: ${dirs.length - badCards.length}`);
log(`styles.css -> _ds_bundle.css: ${readFileSync(join(OUT, 'styles.css'), 'utf8').includes('_ds_bundle.css') ? 'YES' : 'NO ***'}`);
log(`@font-face JetBrains Mono: ${readFileSync(join(OUT, '_ds_fonts.css'), 'utf8').includes('JetBrainsMono-Regular.ttf') ? 'YES' : 'NO ***'}`);
log(`bundle header: ${readFileSync(join(OUT, '_ds_bundle.js'), 'utf8').startsWith('/* @ds-bundle:') ? 'present' : 'MISSING ***'}`);
process.exit(fails.length || badCards.length ? 1 : 0);
