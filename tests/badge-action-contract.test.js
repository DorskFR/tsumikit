import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const badge = await readFile(
	new URL('../src/lib/components/atoms/Badge.svelte', import.meta.url),
	'utf8'
);
const css = badge.slice(badge.indexOf('<style>'));
const bundle = await buildFixture('mount-badge-fixture.js');

/** @param {{ removed?: boolean, onremove?: () => void, onaction?: () => void }} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props });
	flushSync();
	const badges = [...dom.window.document.querySelectorAll('[data-tsu="Badge"]')];
	return {
		badges,
		action: (/** @type {number} */ i) =>
			/** @type {HTMLButtonElement | null} */ (badges[i].querySelector('button.action'))
	};
}

test('Badge exposes actionIcon, actionLabel, onaction and removed alongside removable', () => {
	assert.match(badge, /actionIcon\?: IconName;/);
	assert.match(badge, /actionLabel\?: string;/);
	assert.match(badge, /onaction\?: \(e: MouseEvent\) => void;/);
	assert.match(badge, /removed\?: boolean;/);
	assert.match(badge, /removed = false/);
	assert.match(badge, /removable = false/);
	assert.match(badge, /class:removed/);
	assert.match(badge, /aria-label=\{actionLabel \?\? 'Remove'\}/);
	assert.match(badge, /onclick=\{\(e\) => \(onaction \?\? onremove\)\?\.\(e\)\}/);
});

test('removed mutes the pill and strikes the label but not the action glyph', () => {
	assert.ok(hasDecl(css, '.removed', 'opacity', '0.55'));
	assert.ok(hasDecl(css, '.removed', 'text-decoration', 'line-through'));
	assert.ok(hasDecl(css, '.removed .action', 'text-decoration', 'none'));
});

test('removable alone still renders the × dismiss button wired to onremove', () => {
	let removed = 0;
	const ui = render({ onremove: () => removed++ });
	const btn = ui.action(0);
	assert.ok(btn);
	assert.equal(btn.getAttribute('aria-label'), 'Remove');
	assert.equal(btn.textContent?.trim(), '×');
	assert.equal(btn.querySelector('svg'), null);
	btn.click();
	assert.equal(removed, 1);
});

test('actionIcon renders the action without removable, with its own label and onaction', () => {
	let acted = 0;
	const ui = render({ onaction: () => acted++ });
	const btn = ui.action(1);
	assert.ok(btn);
	assert.equal(btn.getAttribute('aria-label'), 'Keep API_KEY');
	assert.ok(btn.querySelector('svg'));
	assert.equal(btn.textContent?.trim(), '');
	btn.click();
	assert.equal(acted, 1);
});

test('removable with a custom actionIcon swaps the glyph and keeps onremove', () => {
	let removed = 0;
	const ui = render({ onremove: () => removed++ });
	const btn = ui.action(2);
	assert.ok(btn);
	assert.ok(btn.querySelector('svg'));
	assert.equal(btn.getAttribute('aria-label'), 'Remove');
	btn.click();
	assert.equal(removed, 1);
});

test('removed toggles the class; a badge without any action renders no button', () => {
	assert.equal(render().badges[1].classList.contains('removed'), false);
	const ui = render({ removed: true });
	assert.equal(ui.badges[1].classList.contains('removed'), true);
	assert.equal(ui.badges[0].classList.contains('removed'), false);
	assert.equal(ui.action(3), null);
});
