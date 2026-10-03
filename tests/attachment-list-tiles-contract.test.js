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

/** @param {{ tiles?: boolean | 'auto', numbered?: boolean, onremove?: (i: number) => void, onopen?: (i: number) => void }} props */
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

test('AttachmentList exposes numbered, onopen and openLabel', () => {
	assert.match(src, /numbered\?: boolean;/);
	assert.match(src, /onopen\?: \(index: number\) => void;/);
	assert.match(src, /openLabel\?: string;/);
	assert.match(src, /openLabel = 'Open'/);
});

test('numbered: chips and tiles carry the 1-based position; the tile is named with it', () => {
	const { list } = render({ numbered: true });
	const chipNums = [...list.querySelectorAll('li.chip .num')].map((n) => n.textContent?.trim());
	assert.deepEqual(chipNums, ['1', '2', '3', '4']);
	const tileNums = [...list.querySelectorAll('li.tile .tile-num')].map((n) => n.textContent?.trim());
	assert.deepEqual(tileNums, ['1', '2', '3', '4']);
	const trigger = list.querySelector('li.tile [data-tsu="Popover"]');
	assert.equal(trigger?.getAttribute('aria-label'), `1. ${files[0].name}`);
	assert.ok(hasDecl(css, '.tile-num', 'position', 'absolute'));
	assert.equal(render().list.querySelectorAll('.num').length, 0);
});

test('chips show a small cover thumbnail for images only', () => {
	const { list } = render({ tiles: false });
	const chips = [...list.querySelectorAll('li.chip')];
	const mini = chips[0].querySelector('img.mini');
	assert.ok(mini);
	assert.equal(mini.getAttribute('src'), 'blob:thumb');
	assert.equal(mini.getAttribute('alt'), '');
	assert.ok(!chips[1].querySelector('img'));
	assert.ok(hasDecl(css, '.mini', 'width', '1.25em'));
	assert.ok(hasDecl(css, '.mini', 'object-fit', 'cover'));
});

test('onopen: the chip name is a button calling onopen, Remove stays separate', () => {
	/** @type {string[]} */
	const calls = [];
	const { flushSync, list } = render({
		tiles: false,
		onopen: (i) => calls.push(`open:${i}`),
		onremove: (i) => calls.push(`remove:${i}`)
	});
	const chip = list.querySelectorAll('li.chip')[1];
	const open = chip.querySelector('button.open');
	assert.ok(open);
	assert.equal(open.getAttribute('type'), 'button');
	assert.equal(open.getAttribute('title'), 'Open');
	assert.match(open.textContent ?? '', /report\.pdf/);
	/** @type {HTMLButtonElement} */ (open).click();
	const remove = chip.querySelector('button[aria-label="Remove"]');
	assert.ok(remove);
	/** @type {HTMLButtonElement} */ (remove).click();
	flushSync();
	assert.deepEqual(calls, ['open:1', 'remove:1']);
	assert.equal(render({ tiles: false }).list.querySelectorAll('button.open').length, 0);
});

test('onopen: the tile popover shows a larger preview and an Open action, both calling onopen and closing', () => {
	/** @type {number[]} */
	const opened = [];
	const { dom, flushSync, list } = render({ tiles: true, onopen: (i) => opened.push(i) });
	const triggers = list.querySelectorAll('li.tile [data-tsu="Popover"]');
	const panel = openPanel(dom, triggers[0]);
	flushSync();
	const preview = panel.querySelector('button.preview img');
	assert.ok(preview);
	assert.equal(preview.getAttribute('src'), 'blob:thumb');
	/** @type {HTMLButtonElement} */ (preview.closest('button')).click();
	flushSync();
	assert.deepEqual(opened, [0]);
	assert.ok(hasDecl(css, '.preview img', 'max-width', '16rem'));

	const pdf = openPanel(dom, triggers[1]);
	flushSync();
	assert.ok(!pdf.querySelector('button.preview'));
	const open = [...pdf.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Open');
	assert.ok(open);
	open.click();
	flushSync();
	assert.deepEqual(opened, [0, 1]);
});

test('chips clip the head of a long name and keep its last 12 characters', () => {
	const { list } = render({ tiles: false });
	const [long, short] = list.querySelectorAll('li.chip');
	assert.equal(long.querySelector('.head')?.textContent, 'screenshot-with-a-very-l');
	assert.equal(long.querySelector('.tail')?.textContent, 'ong-name.png');
	assert.equal(long.querySelector('[data-tsu="Badge"]')?.getAttribute('title'), files[0].name);
	assert.equal(short.querySelector('.head')?.textContent, 'report.pdf');
	assert.equal(short.querySelector('.tail'), null);
	assert.ok(hasDecl(css, '.head', 'text-overflow', 'ellipsis'));
	assert.ok(hasDecl(css, '.tail,\n\t.size', 'flex', 'none'));
});
