import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const src = await readFile(
	new URL('../src/lib/components/molecules/AttachmentList.svelte', import.meta.url),
	'utf8'
);
const css = src.slice(src.indexOf('<style>'));
const bundle = await buildFixture('mount-attachment-list.js');

const files = [
	{ name: 'screenshot-with-a-very-long-name.png', size: 1_284_311, type: 'image/png', url: 'blob:thumb' },
	{ name: 'report.pdf', size: 88_120, type: 'application/pdf' },
	{ name: 'notes.md', size: 2_048 },
	{ name: 'export.csv', size: 402_133 }
];

/** @param {{ tiles?: boolean | 'auto', onremove?: (i: number) => void }} props */
function render(props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	dom.window.eval(bundle);
	const { mount, flushSync, Fixture } = dom.window.__fixture;
	mount(Fixture, { target: dom.window.document.body, props: { files, ...props } });
	flushSync();
	const list = dom.window.document.querySelector('[data-tsu="AttachmentList"]');
	assert.ok(list);
	return { dom, flushSync, list };
}

/** @param {JSDOM} dom @param {Element} trigger */
function openPanel(dom, trigger) {
	const panel = dom.window.document.getElementById(trigger.getAttribute('popovertarget') ?? '');
	assert.ok(panel);
	panel.dispatchEvent(Object.assign(new dom.window.Event('toggle'), { newState: 'open' }));
	return panel;
}

test('AttachmentList exposes tiles and removeLabel and uses Popover, not Tooltip', () => {
	assert.match(src, /tiles\?: boolean \| 'auto';/);
	assert.match(src, /tiles = 'auto'/);
	assert.match(src, /removeLabel\?: string;/);
	assert.match(src, /import Popover from '\$lib\/components\/molecules\/Popover\.svelte';/);
	assert.doesNotMatch(src, /import Tooltip/);
});

test('auto: the list is an inline-size container and the query flips chips for tiles at 30rem', () => {
	assert.ok(hasDecl(css, '.attachments.auto', 'container-type', 'inline-size'));
	assert.ok(hasDecl(css, '.auto .tile', 'display', 'none'));
	assert.match(
		css,
		/@container \(max-width: 30rem\) {\s*\.auto \.chip {\s*display: none;\s*}\s*\.auto \.tile {\s*display: flex;/
	);
});

test('auto renders a chip and a tile per file; tiles / chips only when forced', () => {
	const auto = render();
	assert.equal(auto.list.querySelectorAll('li.chip [data-tsu="Badge"]').length, 4);
	assert.equal(auto.list.querySelectorAll('li.tile [data-tsu="Popover"]').length, 4);
	assert.ok(auto.list.classList.contains('auto'));

	const tiles = render({ tiles: true });
	assert.equal(tiles.list.querySelectorAll('li.chip').length, 0);
	assert.equal(tiles.list.querySelectorAll('li.tile [data-tsu="Popover"]').length, 4);
	assert.ok(tiles.list.classList.contains('tiles'));
	assert.ok(!tiles.list.classList.contains('auto'));

	const chips = render({ tiles: false });
	assert.equal(chips.list.querySelectorAll('li.chip').length, 4);
	assert.equal(chips.list.querySelectorAll('li.tile').length, 0);
});

test('tile trigger is named after the file and shows a thumbnail for images, a glyph otherwise', () => {
	const { list } = render({ tiles: true });
	const triggers = [...list.querySelectorAll('li.tile [data-tsu="Popover"]')];
	assert.equal(triggers[0].getAttribute('aria-label'), files[0].name);
	assert.equal(triggers[0].getAttribute('aria-haspopup'), 'dialog');
	const img = triggers[0].querySelector('img.thumb');
	assert.ok(img);
	assert.equal(img.getAttribute('src'), 'blob:thumb');
	assert.equal(img.getAttribute('alt'), '');
	assert.ok(!triggers[1].querySelector('img'));
	assert.ok(triggers[1].querySelector('svg'));
});

test('tile popover shows the full name, the size and a working Remove', () => {
	/** @type {number[]} */
	const removed = [];
	const { dom, flushSync, list } = render({ tiles: true, onremove: (i) => removed.push(i) });
	const panel = openPanel(dom, list.querySelectorAll('li.tile [data-tsu="Popover"]')[1]);
	flushSync();
	assert.match(panel.textContent ?? '', /report\.pdf/);
	assert.match(panel.textContent ?? '', /86\.1 KB/);
	const remove = panel.querySelector('button[aria-label="Remove"]');
	assert.ok(remove);
	/** @type {HTMLButtonElement} */ (remove).click();
	flushSync();
	assert.deepEqual(removed, [1]);
});

test('without onremove neither the chip nor the popover offers Remove', () => {
	const { dom, flushSync, list } = render();
	assert.equal(list.querySelectorAll('li.chip button').length, 0);
	const trigger = list.querySelector('li.tile [data-tsu="Popover"]');
	assert.ok(trigger);
	const panel = openPanel(dom, trigger);
	flushSync();
	assert.equal(panel.querySelectorAll('button').length, 0);
});

test('tile popover Remove is an icon-only trash button beside the name', () => {
	const { dom, flushSync, list } = render({ tiles: true, onremove: () => {} });
	const panel = openPanel(dom, list.querySelectorAll('li.tile [data-tsu="Popover"]')[0]);
	flushSync();
	const head = panel.querySelector('.detail-head');
	assert.ok(head);
	const remove = head.querySelector('button[aria-label="Remove"]');
	assert.ok(remove);
	assert.equal(remove.textContent?.trim(), '');
	assert.ok(remove.querySelector('svg'));
	assert.ok(hasDecl(css, '.detail-head > :global(button)', 'margin-inline-start', 'auto'));
});
