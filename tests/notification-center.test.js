import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { JSDOM } from 'jsdom';
import { dayLabel } from '../src/lib/components/organisms/notification-center.ts';
import { buildFixture } from './fixtures/build.mjs';

const bundle = await buildFixture('mount-notification.svelte.js');
const settle = () => new Promise((r) => setTimeout(r, 0));
/** @type {import('jsdom').DOMWindow[]} */
const windows = [];
after(() => {
	for (const w of windows) w.close();
});

/** @param {Record<string, unknown>} init */
function render(init) {
	const w = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	}).window;
	windows.push(w);
	w.matchMedia = /** @type {any} */ (
		() => ({ matches: false, addEventListener() {}, removeEventListener() {} })
	);
	const proto = w.HTMLElement.prototype;
	/** @param {HTMLElement} el @param {'open' | 'closed'} newState */
	const toggle = (el, newState) => {
		const e = new w.Event('toggle');
		Object.assign(e, { oldState: newState === 'open' ? 'closed' : 'open', newState });
		el.dispatchEvent(e);
	};
	proto.showPopover = function () {
		if (this.hasAttribute('data-open')) return;
		this.setAttribute('data-open', '');
		toggle(this, 'open');
	};
	proto.hidePopover = function () {
		if (!this.hasAttribute('data-open')) return;
		this.removeAttribute('data-open');
		toggle(this, 'closed');
	};
	w.HTMLDialogElement.prototype.showModal = function () {
		this.setAttribute('open', '');
	};
	w.HTMLDialogElement.prototype.close = function () {
		this.removeAttribute('open');
		this.dispatchEvent(new w.Event('close'));
	};
	w.eval(bundle);
	const { mount, flushSync, Fixture, props } = w.__fixture;
	const live = props(init);
	mount(Fixture, { target: w.document.body, props: { live } });
	flushSync();
	const doc = w.document;
	const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (doc.querySelector(s));
	const qa = (/** @type {string} */ s) => /** @type {HTMLElement[]} */ ([...doc.querySelectorAll(s)]);
	const click = async (/** @type {HTMLElement} */ el) => {
		el.click();
		flushSync();
		await settle();
	};
	const key = async (/** @type {Element} */ el, /** @type {string} */ k) => {
		el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
		flushSync();
		await settle();
	};
	const set = async (/** @type {Record<string, unknown>} */ patch) => {
		Object.assign(live, patch);
		flushSync();
		await settle();
		flushSync();
	};
	const logged = () => JSON.parse(JSON.stringify(live.log));
	return { w, doc, live, q, qa, click, key, set, flushSync, logged };
}

const now = Date.now();
const approval = {
	id: 'a1',
	title: 'Deploy api to production',
	text: 'Requested by the release pipeline',
	time: now,
	unread: true,
	tone: 'warning',
	actions: [
		{ id: 'approve', label: 'Approve', variant: 'primary' },
		{ id: 'reject', label: 'Reject', variant: 'danger', requiresConfirm: true }
	]
};
const info = { id: 'i1', title: 'Backup finished', time: now - 86_400_000, tone: 'info' };
const resolved = { id: 'r1', title: 'Token rotation', time: now, state: 'Approved on phone', actions: approval.actions };

test('bell: badge hidden at 0, capped at 99+, exact count in the accessible name', async () => {
	for (const sheet of [false, true]) {
		const t = render({ sheet, unread: 0 });
		const bell = t.q('[data-tsu="NotificationCenter"] [aria-haspopup="dialog"]');
		assert.equal(bell.getAttribute('aria-expanded'), 'false');
		assert.equal(t.q('.pop-count, .btn-count'), null, `no badge at 0 (sheet=${sheet})`);
		await t.set({ unread: 150 });
		assert.equal(t.q('.pop-count, .btn-count').textContent, '99+');
		const name = (bell.getAttribute('aria-label') ?? '') + (t.q('.btn-count-sr')?.textContent ?? '');
		assert.match(name, /Notifications, 150/);
	}
});

test('bell: unread defaults to the unread items', () => {
	const t = render({ items: [approval, info] });
	assert.equal(t.q('.pop-count').textContent, '1');
});

test('item: unread shows a Dot with a screen-reader label', async () => {
	const t = render({ kind: 'item', unread: true });
	assert.ok(t.q('.notif-dot [data-tsu="Dot"], .notif-dot span'));
	assert.equal(t.q('.notif-dot .sr-only').textContent, 'Unread');
	await t.set({ unread: false });
	assert.equal(t.q('.notif-dot'), null);
});

test('item: resolved renders the state label and no actions', () => {
	const t = render({ kind: 'item', state: 'Approved on phone', actions: approval.actions });
	assert.equal(t.q('.notif-state').textContent?.trim(), 'Approved on phone');
	assert.equal(t.qa('[data-action]').length, 0);
	assert.ok(t.q('[data-tsu="NotificationItem"]').hasAttribute('data-resolved'));
});

test('item: actions past the second go into a "More actions" menu', async () => {
	const actions = ['one', 'two', 'three', 'four'].map((id) => ({ id, label: id.toUpperCase() }));
	const t = render({ kind: 'item', actions });
	assert.deepEqual(
		t.qa('.notif-actions > [data-action], .notif-actions [data-action]').map((b) => b.dataset.action),
		['one', 'two']
	);
	const more = t.q('[aria-label="More actions"]');
	assert.ok(more);
	t.q('[data-tsu="NotificationItem"] [popover]').showPopover();
	t.flushSync();
	await t.set({});
	const rows = t.qa('[role="menuitem"]').map((r) => r.textContent?.trim());
	assert.deepEqual(rows, ['THREE', 'FOUR']);
	await t.click(t.qa('[role="menuitem"]')[1]);
	assert.deepEqual(t.logged(), [['action', 'four']]);
});

test('item: requiresConfirm needs a second click', async () => {
	const t = render({ kind: 'item', actions: approval.actions });
	await t.click(t.q('[data-action="reject"]'));
	assert.deepEqual(t.logged(), []);
	assert.match(t.q('.notif-ask').textContent ?? '', /Reject\?/);
	await t.click(t.q('[data-confirm]'));
	assert.deepEqual(t.logged(), [['action', 'reject']]);
});

test('item: requiresConfirm can be cancelled', async () => {
	const t = render({ kind: 'item', actions: approval.actions });
	await t.click(t.q('[data-action="reject"]'));
	const cancel = t.qa('.notif-actions button').find((b) => b.textContent?.trim() === 'Cancel');
	await t.click(/** @type {HTMLElement} */ (cancel));
	assert.equal(t.q('[data-confirm]'), null);
	assert.ok(t.q('[data-action="approve"]'));
	assert.deepEqual(t.logged(), []);
});

test('item: a pending action ignores a second click until it settles', async () => {
	/** @type {() => void} */
	let resolve = () => {};
	const t = render({
		kind: 'item',
		actions: approval.actions,
		onaction: () => new Promise((r) => (resolve = () => r(undefined)))
	});
	const approve = t.q('[data-action="approve"]');
	await t.click(approve);
	await t.click(t.q('[data-action="approve"]'));
	await t.click(t.q('[data-action="reject"]'));
	assert.deepEqual(t.logged(), [['action', 'approve']]);
	assert.equal(t.q('[data-action="approve"]').getAttribute('aria-busy'), 'true');
	resolve();
	await t.set({});
	await t.click(t.q('[data-action="approve"]'));
	assert.equal(t.logged().length, 2);
});

test('item: a pending action clears when the parent resolves the item', async () => {
	const t = render({ kind: 'item', actions: approval.actions, onaction: () => new Promise(() => {}) });
	await t.click(t.q('[data-action="approve"]'));
	await t.set({ state: 'Approved' });
	assert.equal(t.qa('[data-action]').length, 0);
	assert.equal(t.q('.notif-state').textContent?.trim(), 'Approved');
});

test('item: clicking the body or Enter opens it; dismiss fires ondismiss', async () => {
	const t = render({ kind: 'item', dismissable: true, text: 'Body' });
	await t.click(t.q('.notif-text'));
	const root = t.q('[data-tsu="NotificationItem"]');
	await t.key(root, 'Enter');
	await t.click(t.q('[aria-label="Dismiss"]'));
	assert.deepEqual(t.logged(), [['open'], ['open'], ['dismiss']]);
});

test('center: groups by day, labelled lists, empty state, mark all read', async () => {
	const t = render({ items: [approval, resolved, info], open: true });
	await t.set({});
	assert.deepEqual(
		t.qa('.nc-day').map((h) => h.textContent),
		['Today', 'Yesterday']
	);
	for (const ul of t.qa('.nc-list')) assert.ok(t.doc.getElementById(ul.getAttribute('aria-labelledby') ?? ''));
	assert.equal(t.q('.pop-panel').getAttribute('role'), 'dialog');
	assert.equal(t.q('.pop-panel').getAttribute('aria-label'), 'Notifications');
	await t.click(/** @type {HTMLElement} */ (t.qa('button').find((b) => b.textContent?.trim() === 'Mark all read')));
	assert.deepEqual(t.logged().at(-1), ['readall']);
	await t.set({ items: [] });
	assert.match(t.q('[data-tsu="EmptyState"]').textContent ?? '', /No notifications/);
});

test('center: opening does not mark read; opening an unread item does', async () => {
	const t = render({ items: [approval, info] });
	await t.set({ open: true });
	assert.deepEqual(t.logged(), [['openchange', true]]);
	await t.key(t.q('[data-id="a1"]'), 'Enter');
	await t.key(t.q('[data-id="i1"]'), 'Enter');
	assert.deepEqual(t.logged().slice(1), [['read', 'a1']]);
});

test('center: item actions report the item id', async () => {
	const t = render({ items: [approval], open: true });
	await t.set({});
	await t.click(t.q('[data-id="a1"] [data-action="approve"]'));
	assert.deepEqual(t.logged().at(-1), ['action', 'a1', 'approve']);
});

test('center: arrows move between items with a roving tabindex', async () => {
	const t = render({ items: [approval, resolved, info] });
	await t.set({ open: true });
	const ids = () => t.qa('[data-tsu="NotificationItem"]').map((el) => `${el.dataset.id}:${el.tabIndex}`);
	assert.deepEqual(ids(), ['a1:0', 'r1:-1', 'i1:-1']);
	assert.equal(t.doc.activeElement?.getAttribute('data-id'), 'a1');
	await t.key(/** @type {Element} */ (t.doc.activeElement), 'ArrowDown');
	assert.equal(t.doc.activeElement?.getAttribute('data-id'), 'r1');
	await t.key(/** @type {Element} */ (t.doc.activeElement), 'End');
	assert.equal(t.doc.activeElement?.getAttribute('data-id'), 'i1');
	assert.deepEqual(ids(), ['a1:-1', 'r1:-1', 'i1:0']);
	await t.key(/** @type {Element} */ (t.doc.activeElement), 'ArrowUp');
	assert.equal(t.doc.activeElement?.getAttribute('data-id'), 'r1');
});

test('center: filters narrow to unread and needs-action', async () => {
	const t = render({ items: [approval, resolved, info], filters: true });
	await t.set({ open: true });
	assert.equal(t.qa('[data-tsu="NotificationItem"]').length, 3);
	await t.click(t.q('[data-chip="unread"]'));
	assert.deepEqual(
		t.qa('[data-tsu="NotificationItem"]').map((el) => el.dataset.id),
		['a1']
	);
	await t.click(t.q('[data-chip="action"]'));
	assert.deepEqual(
		t.qa('[data-tsu="NotificationItem"]').map((el) => el.dataset.id),
		['a1']
	);
});

test('center: LoadMore pages when hasMore', async () => {
	const t = render({ items: [info], hasMore: true });
	await t.set({ open: true });
	await t.click(/** @type {HTMLElement} */ (t.q('[data-tsu="LoadMore"] button')));
	assert.deepEqual(t.logged().at(-1), ['loadmore']);
});

for (const sheet of [false, true])
	test(`center: Escape closes and returns focus to the bell (${sheet ? 'drawer' : 'popover'})`, async () => {
		const t = render({ items: [approval], sheet });
		const bell = t.q('[data-tsu="NotificationCenter"] [aria-haspopup="dialog"]');
		bell.focus();
		await t.set({ open: true });
		assert.equal(bell.getAttribute('aria-expanded'), 'true');
		const focused = /** @type {Element} */ (t.doc.activeElement);
		assert.equal(focused.getAttribute('data-id'), 'a1');
		await t.key(focused, 'Escape');
		await t.set({});
		assert.equal(t.live.open, false);
		assert.equal(bell.getAttribute('aria-expanded'), 'false');
		assert.equal(t.doc.activeElement, bell);
		assert.deepEqual(t.logged().at(-1), ['openchange', false]);
	});

test('dayLabel: today, yesterday, then a weekday date', () => {
	const ref = new Date(2026, 10, 16, 9);
	assert.equal(dayLabel(new Date(2026, 10, 16, 0, 5), ref), 'Today');
	assert.equal(dayLabel(new Date(2026, 10, 15, 23), ref), 'Yesterday');
	assert.match(dayLabel(new Date(2026, 10, 10), ref), /10/);
	assert.match(dayLabel(new Date(2025, 0, 2), ref), /2025/);
});
