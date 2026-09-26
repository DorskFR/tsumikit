import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(`../src/lib/${p}`, import.meta.url), 'utf8');
const [feed, panel, status, bubble, composer, index, readme, page] = await Promise.all([
	read('components/organisms/ConversationFeed.svelte'),
	read('components/organisms/ConversationPanel.svelte'),
	read('components/molecules/StatusBar.svelte'),
	read('components/molecules/ChatBubble.svelte'),
	read('components/molecules/Composer.svelte'),
	read('index.ts'),
	readFile(new URL('../README.md', import.meta.url), 'utf8'),
	readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8')
]);
const bundle = await buildFixture('mount-conversation.svelte.js');

const msgs = (/** @type {number} */ from, /** @type {number} */ to) =>
	Array.from({ length: to - from + 1 }, (_, i) => ({ id: from + i, text: `msg **${from + i}**` }));

function render(/** @type {Record<string, unknown>} */ props = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only', pretendToBeVisual: true });
	const win = dom.window;
	win.ResizeObserver = class {
		observe() {}
		disconnect() {}
	};
	win.eval(bundle);
	const { mount, flushSync, Fixture, props: live } = win.__fixture;
	const state = live(props);
	mount(Fixture, { target: win.document.body, props: state });
	flushSync();
	const doc = win.document;
	const scroller = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="ConversationFeed"] > .feed'));
	// jsdom has no layout: the geometry is scripted per test.
	let scrollHeight = 1000;
	let scrollTop = 0;
	const clientHeight = 300;
	Object.defineProperty(scroller, 'scrollHeight', { get: () => scrollHeight, configurable: true });
	Object.defineProperty(scroller, 'clientHeight', { get: () => clientHeight, configurable: true });
	Object.defineProperty(scroller, 'scrollTop', {
		get: () => scrollTop,
		set: (v) => {
			scrollTop = Math.max(0, Math.min(v, scrollHeight - clientHeight));
		},
		configurable: true
	});
	scroller.scrollTo = /** @type {Element['scrollTo']} */ (
		(/** @type {ScrollToOptions} */ o) => {
			scroller.scrollTop = o.top ?? 0;
		}
	);
	return {
		doc,
		win,
		state,
		scroller,
		flush: flushSync,
		grow(/** @type {number} */ h) {
			scrollHeight = h;
		},
		scrollTo(/** @type {number} */ top) {
			scroller.scrollTop = top;
			scroller.dispatchEvent(new win.Event('scroll'));
			flushSync();
		},
		settle: () => new Promise((r) => setTimeout(r, 0)).then(flushSync),
		jump: () => /** @type {HTMLElement | null} */ (doc.querySelector('[data-tsu="ConversationFeed"] .jump button'))
	};
}

test('new pieces are exported', () => {
	assert.match(index, /default as StatusBar } from '\.\/components\/molecules\/StatusBar\.svelte'/);
	assert.match(index, /default as ConversationFeed } from '\.\/components\/organisms\/ConversationFeed\.svelte'/);
	assert.match(index, /default as ConversationPanel } from '\.\/components\/organisms\/ConversationPanel\.svelte'/);
	assert.match(index, /escapeHtml,\s+type Highlight,\s+type RenderMarkdownOptions,\s+renderMarkdown,\s+stripAnsi,\s+} from '\.\/markdown'/);
	assert.match(readme, /### ConversationPanel, ConversationFeed, StatusBar/);
	assert.match(page, /<section class="section" id="conversation">/);
});

test('ConversationFeed: generic props, fills its parent, 80px stick threshold, scrollToBottom exported', () => {
	assert.match(feed, /<script lang="ts" generics="T">/);
	assert.match(feed, /items: T\[\];/);
	assert.match(feed, /key: \(item: T\) => string \| number;/);
	assert.match(feed, /item: Snippet<\[T, number\]>;/);
	assert.match(feed, /loadMore\?: 'idle' \| 'loading' \| 'error' \| 'done';/);
	assert.match(feed, /follow = true,/);
	assert.match(feed, /jumpLabel = 'Jump to latest',/);
	assert.match(feed, /const THRESHOLD = 80;/);
	assert.match(feed, /export function scrollToBottom\(behavior: ScrollBehavior = 'auto'\)/);
	assert.match(feed, /<LoadMore pill state={loadMore} onload={onloadmore} label={loadMoreLabel} \/>/);
	assert.ok(hasDecl(feed, '.feed', 'flex', '1'));
	assert.ok(hasDecl(feed, '.feed', 'min-height', '0'));
	assert.ok(hasDecl(feed, '.feed', 'overflow', 'auto'));
	assert.ok(hasDecl(feed, '.jump', 'position', 'absolute'));
});

test('ConversationFeed renders items keyed, the LoadMore pill first and the empty snippet', () => {
	const ui = render({ items: msgs(1, 3), loadMore: 'idle' });
	const feedEl = ui.doc.querySelector('[data-tsu="ConversationFeed"]');
	assert.ok(feedEl);
	assert.equal(ui.scroller.firstElementChild?.getAttribute('data-tsu'), 'LoadMore');
	assert.equal(ui.doc.querySelectorAll('[data-tsu="ChatBubble"]').length, 3);
	assert.equal(ui.doc.querySelector('[data-tsu="ChatBubble"] .body strong')?.textContent, '1');
	assert.equal(ui.doc.querySelector('#empty'), null);

	const empty = render({ items: [] });
	assert.ok(empty.doc.querySelector('#empty'));
	assert.equal(empty.doc.querySelector('[data-tsu="LoadMore"]'), null);
});

test('appending while at the bottom keeps the feed pinned; no jump pill', async () => {
	const ui = render({ items: msgs(1, 5) });
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 700);
	ui.grow(1400);
	ui.state.items = msgs(1, 6);
	ui.flush();
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 1100);
	assert.equal(ui.jump(), null);
});

test('appending while scrolled up leaves the position alone and shows the jump pill, which scrolls down', async () => {
	const ui = render({ items: msgs(1, 5) });
	await ui.settle();
	ui.scrollTo(100);
	ui.grow(1400);
	ui.state.items = msgs(1, 6);
	ui.flush();
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 100);
	const pill = ui.jump();
	assert.ok(pill);
	assert.match(pill.textContent ?? '', /Jump to latest/);
	pill.click();
	ui.flush();
	assert.equal(ui.scroller.scrollTop, 1100);
	assert.equal(ui.jump(), null);
});

test('scrolling within 80px of the bottom re-sticks', async () => {
	const ui = render({ items: msgs(1, 5) });
	await ui.settle();
	ui.scrollTo(100);
	ui.scrollTo(700 - 79);
	ui.grow(1400);
	ui.state.items = msgs(1, 6);
	ui.flush();
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 1100);
});

test('prepending older items preserves the distance from the bottom', async () => {
	const ui = render({ items: msgs(10, 14), loadMore: 'idle' });
	await ui.settle();
	ui.scrollTo(200);
	ui.state.items = msgs(6, 14);
	ui.flush();
	ui.grow(1800);
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 1000);
	assert.equal(ui.jump(), null);
});

test('follow=false never auto-scrolls but still offers the pill', async () => {
	const ui = render({ items: msgs(1, 5), follow: false });
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 0);
	ui.grow(1400);
	ui.state.items = msgs(1, 6);
	ui.flush();
	await ui.settle();
	assert.equal(ui.scroller.scrollTop, 0);
	assert.ok(ui.jump());
});

test('ConversationPanel lays out header / body / status / composer as a filling column', () => {
	assert.match(panel, /children: Snippet;/);
	for (const slot of ['header', 'status', 'composer']) assert.match(panel, new RegExp(`${slot}\\?: Snippet;`));
	assert.ok(hasDecl(panel, '.panel', 'flex-direction', 'column'));
	assert.ok(hasDecl(panel, '.panel', 'min-height', '0'));
	assert.ok(hasDecl(panel, '.panel-body', 'flex', '1'));
	assert.ok(hasDecl(panel, '.panel-body', 'min-height', '0'));
	const ui = render({ items: msgs(1, 2), toolbar: true, tone: 'busy' });
	const p = /** @type {HTMLElement} */ (ui.doc.querySelector('[data-tsu="ConversationPanel"]'));
	assert.deepEqual([...p.children].map((c) => c.classList[0]), ['panel-header', 'panel-body', 'panel-status', 'panel-composer']);
	assert.ok(p.querySelector('.panel-header #hdr'));
	assert.ok(p.querySelector('.panel-body [data-tsu="ConversationFeed"]'));
	assert.ok(p.querySelector('.panel-status [data-tsu="StatusBar"]'));
	assert.ok(p.querySelector('.panel-composer [data-tsu="Composer"]'));
});

test('StatusBar: live status region, Spinner while busy, Dot otherwise, label/children/trailing', () => {
	assert.match(status, /tone\?: Tone;/);
	assert.match(status, /type Tone = 'idle' \| 'busy' \| 'ok' \| 'warn' \| 'error';/);
	assert.match(status, /role="status"/);
	assert.match(status, /aria-live="polite"/);
	assert.match(status, /{#if tone === 'busy'}\s*<Spinner/);
	assert.match(status, /<Dot color={TONE_COLOR\[tone\]}/);
	assert.match(status, /{#if children}{@render children\(\)}{:else}{label}{\/if}/);
	assert.match(status, /{#if trailing}<span class="status-trailing">{@render trailing\(\)}<\/span>{\/if}/);
	const busy = render({ items: [], tone: 'busy' });
	const bar = /** @type {HTMLElement} */ (busy.doc.querySelector('[data-tsu="StatusBar"]'));
	assert.equal(bar.getAttribute('role'), 'status');
	assert.equal(bar.getAttribute('aria-busy'), 'true');
	assert.equal(bar.dataset.tone, 'busy');
	assert.ok(bar.querySelector('[data-tsu="Spinner"]'));
	assert.equal(bar.querySelector('.status-label')?.textContent?.trim(), 'Status busy');
	const ok = render({ items: [], tone: 'ok' });
	const okBar = /** @type {HTMLElement} */ (ok.doc.querySelector('[data-tsu="StatusBar"]'));
	assert.equal(okBar.getAttribute('aria-busy'), null);
	assert.ok(okBar.querySelector('[data-tsu="Dot"]'));
});

test('ChatBubble: timestamp after the role pill, markdown body via Prose, footer row, children optional', () => {
	assert.match(bubble, /timestamp\?: TimeInput;/);
	assert.match(bubble, /footer\?: Snippet;/);
	assert.match(bubble, /markdown\?: string;/);
	assert.match(bubble, /children\?: Snippet;/);
	assert.match(bubble, /<Badge size="xs" class="role-pill">{roleLabel \?\? role}<\/Badge>\s*{#if timestamp !== undefined}<Timestamp value={timestamp} mode="time" size="xs" \/>{\/if}/);
	assert.match(bubble, /{#if children}{@render children\(\)}{:else if html !== undefined}<Prose compact {html} \/>{\/if}/);
	assert.match(bubble, /{#if footer}<footer class="footer">{@render footer\(\)}<\/footer>{\/if}/);
	const ui = render({ items: msgs(7, 7) });
	const b = /** @type {HTMLElement} */ (ui.doc.querySelector('[data-tsu="ChatBubble"]'));
	const meta = /** @type {HTMLElement} */ (b.querySelector('.meta'));
	assert.ok(meta.children[1]?.querySelector('[data-tsu="Timestamp"]') ?? meta.children[1]?.matches('[data-tsu="Timestamp"]'));
	assert.ok(b.querySelector('.body [data-tsu="Prose"] p strong'));
	assert.equal(b.querySelector('footer.footer .ft')?.textContent, '7');
});

test('Composer: toolbar row under the field carries attach + start slot left and send right', () => {
	assert.match(composer, /toolbarStart\?: Snippet;/);
	assert.match(composer, /toolbarEnd\?: Snippet;/);
	assert.match(composer, /const toolbar = \$derived\(!!toolbarStart \|\| !!toolbarEnd\);/);
	assert.match(composer, /leading={!toolbar && \(leading \|\| hasAttach\) \? startControls : undefined}/);
	assert.match(composer, /trailing={toolbar \? undefined : endControls}/);
	assert.ok(hasDecl(composer, '.toolbar', 'justify-content', 'space-between'));

	const plain = render({ items: [] });
	const pc = /** @type {HTMLElement} */ (plain.doc.querySelector('[data-tsu="Composer"]'));
	assert.equal(pc.querySelector('.toolbar'), null);
	assert.ok(pc.querySelector('.ig-leading [data-tsu="FileButton"], .ig-leading input[type="file"]'));
	assert.ok(pc.querySelector('.ig-trailing button[aria-label="Send"]'));

	const ui = render({ items: [], toolbar: true });
	const c = /** @type {HTMLElement} */ (ui.doc.querySelector('[data-tsu="Composer"]'));
	const bar = /** @type {HTMLElement} */ (c.querySelector('.toolbar'));
	assert.ok(bar);
	assert.equal(bar.previousElementSibling?.getAttribute('data-tsu'), 'InputGroup');
	assert.equal(c.querySelector('.ig-leading'), null);
	assert.equal(c.querySelector('.ig-trailing'), null);
	const start = /** @type {HTMLElement} */ (bar.querySelector('.toolbar-start'));
	assert.ok(start.querySelector('input[type="file"]'));
	assert.equal(start.lastElementChild?.id, 'pick');
	const end = /** @type {HTMLElement} */ (bar.querySelector('.toolbar-end'));
	assert.equal(end.lastElementChild?.getAttribute('aria-label'), 'Send');
});
