import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-stores-select-button.js');

/** @param {Record<string, string>} [seed] */
function env(seed = {}) {
	const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
	const win = dom.window;
	for (const [k, v] of Object.entries(seed)) win.localStorage.setItem(k, v);
	win.eval(bundle);
	return { win, root: win.document.documentElement, fx: win.__fixture };
}

/** @param {import('jsdom').DOMWindow} win */
const kitKeys = (win) => Object.keys(win.localStorage).filter((k) => k.startsWith('tsumikit'));

test('persistence off: choosing a theme or a text size writes no tsumikit key', () => {
	const { win, fx, root } = env();
	fx.theme.configure({ persist: false });
	fx.fontScale.configure({ persist: false });
	fx.theme.set('nord');
	fx.theme.setLook(fx.theme.look);
	fx.fontScale.set('large');
	assert.equal(root.getAttribute('data-theme'), 'nord');
	assert.equal(root.style.getPropertyValue('--fs-scale'), '1.2');
	assert.deepEqual(kitKeys(win), []);
});

test('persistence off: a stale stored copy is dropped and removed, the server value wins', () => {
	const { win, fx, root } = env({
		'tsumikit-theme': JSON.stringify({ mode: 'light', light: 'sepia', dark: 'dracula' }),
		'tsumikit-font-scale': 'smallest'
	});
	assert.equal(fx.theme.current, 'sepia', 'default mode still restores the stored copy');
	assert.equal(fx.fontScale.levelId, 'smallest');
	fx.theme.configure({ persist: false });
	fx.fontScale.configure({ persist: false });
	assert.deepEqual(kitKeys(win), []);
	assert.equal(fx.fontScale.levelId, 'normal');
	assert.notEqual(fx.theme.current, 'sepia');
	fx.theme.hydrate({ mode: 'dark', light: 'light', dark: 'gruvbox' });
	fx.fontScale.hydrate('large');
	assert.equal(root.getAttribute('data-theme'), 'gruvbox');
	assert.equal(root.style.getPropertyValue('--fs-scale'), '1.2');
	fx.theme.register({ id: 'mine', label: 'Mine', mode: 'dark' });
	assert.equal(fx.theme.current, 'gruvbox', 'a re-resolve keeps the hydrated value');
	assert.deepEqual(kitKeys(win), []);
});

test('hydrate does not fire onchange; a user change does', () => {
	const { fx } = env();
	fx.theme.configure({ persist: false });
	fx.fontScale.configure({ persist: false });
	/** @type {unknown[]} */
	const themes = [];
	/** @type {string[]} */
	const scales = [];
	fx.theme.onchange = (/** @type {unknown} */ p) => themes.push(p);
	fx.fontScale.onchange = (/** @type {string} */ id) => scales.push(id);
	fx.theme.hydrate({ mode: 'dark', light: 'light', dark: 'nord' });
	fx.fontScale.hydrate('small');
	assert.equal(fx.fontScale.levelId, 'small');
	assert.deepEqual(themes, []);
	assert.deepEqual(scales, []);
	fx.theme.set('mocha');
	fx.fontScale.set('largest');
	assert.equal(themes.length, 1);
	assert.equal(/** @type {{ dark: string }} */ (themes[0]).dark, 'mocha');
	assert.deepEqual(scales, ['largest']);
});

test('fontScale.hydrate falls back to normal for an unknown id', () => {
	const { fx } = env();
	fx.fontScale.hydrate('huge');
	assert.equal(fx.fontScale.levelId, 'normal');
});

test('default stays persistent: changes are written and onchange still fires', () => {
	const { win, fx } = env();
	/** @type {string[]} */
	const scales = [];
	fx.fontScale.onchange = (/** @type {string} */ id) => scales.push(id);
	fx.fontScale.set('small');
	fx.theme.set('dracula');
	assert.equal(win.localStorage.getItem('tsumikit-font-scale'), 'small');
	assert.match(win.localStorage.getItem('tsumikit-theme') ?? '', /dracula/);
	assert.deepEqual(scales, ['small']);
	fx.fontScale.hydrate('large');
	assert.equal(win.localStorage.getItem('tsumikit-font-scale'), 'small', 'hydrate never writes');
});
