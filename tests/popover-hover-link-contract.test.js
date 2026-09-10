import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
	HOVER_CLOSE_GRACE,
	HOVER_OPEN_DELAY,
	createHoverIntent,
	opensOnHover,
} from '../src/lib/components/molecules/popover-hover.js';

const popover = await readFile(
	new URL('../src/lib/components/molecules/Popover.svelte', import.meta.url),
	'utf8'
);
const docs = await readFile(new URL('../src/routes/+page.svelte', import.meta.url), 'utf8');

function fakeClock() {
	/** @type {Map<number, { fn: () => void, at: number }>} */
	const timers = new Map();
	let id = 0;
	let now = 0;
	return {
		/** @type {(fn: () => void, ms: number) => number} */
		schedule: (fn, ms) => {
			timers.set(++id, { fn, at: now + ms });
			return id;
		},
		/** @type {(handle: number) => void} */
		cancel: (handle) => void timers.delete(handle),
		/** @param {number} ms */
		advance(ms) {
			now += ms;
			for (const [key, t] of [...timers]) {
				if (t.at <= now) {
					timers.delete(key);
					t.fn();
				}
			}
		},
	};
}

test('hover opening is limited to fine pointers and to openOn="hover"', () => {
	assert.equal(opensOnHover('hover', 'mouse'), true);
	assert.equal(opensOnHover('hover', 'pen'), true);
	assert.equal(opensOnHover('hover', 'touch'), false);
	assert.equal(opensOnHover('hover', undefined), false);
	assert.equal(opensOnHover('click', 'mouse'), false);
});

test('entering opens after the delay and leaving closes after the grace period', () => {
	const clock = fakeClock();
	/** @type {string[]} */
	const calls = [];
	const hover = createHoverIntent({
		open: () => calls.push('open'),
		close: () => calls.push('close'),
		schedule: clock.schedule,
		cancel: clock.cancel,
	});

	hover.enter();
	clock.advance(HOVER_OPEN_DELAY - 1);
	assert.deepEqual(calls, []);
	clock.advance(1);
	assert.deepEqual(calls, ['open']);

	hover.leave();
	clock.advance(HOVER_CLOSE_GRACE - 1);
	assert.deepEqual(calls, ['open']);
	clock.advance(1);
	assert.deepEqual(calls, ['open', 'close']);
});

test('a pending open is dropped when the pointer leaves before the delay', () => {
	const clock = fakeClock();
	/** @type {string[]} */
	const calls = [];
	const hover = createHoverIntent({
		open: () => calls.push('open'),
		close: () => calls.push('close'),
		schedule: clock.schedule,
		cancel: clock.cancel,
	});
	hover.enter(200);
	clock.advance(100);
	hover.leave(50);
	clock.advance(200);
	assert.deepEqual(calls, ['close']);
});

test('travelling from trigger to panel within the grace period keeps the panel open', () => {
	const clock = fakeClock();
	/** @type {string[]} */
	const calls = [];
	const hover = createHoverIntent({
		open: () => calls.push('open'),
		close: () => calls.push('close'),
		schedule: clock.schedule,
		cancel: clock.cancel,
	});
	hover.enter(0);
	clock.advance(0);
	hover.leave(120);
	clock.advance(60);
	hover.cancel();
	clock.advance(1000);
	assert.deepEqual(calls, ['open']);
	assert.equal(hover.pending, false);
});

test('Popover exposes the hover and link props with their documented defaults', () => {
	assert.match(popover, /openOn = 'click',/);
	assert.match(popover, /hoverDelay = HOVER_OPEN_DELAY,/);
	assert.match(popover, /as = 'button',/);
	assert.match(popover, /openOn\?: 'click' \| 'hover';/);
	assert.match(popover, /hoverDelay\?: number;/);
	assert.match(popover, /as\?: 'button' \| 'a';/);
	assert.match(popover, /href\?: string;/);
	assert.equal(HOVER_OPEN_DELAY, 150);
});

test('the trigger is the element `as` names, keeping popovertarget for buttons only', () => {
	const trigger = popover.slice(popover.indexOf('<svelte:element'), popover.indexOf('</svelte:element>'));
	assert.match(trigger, /this=\{as\}/);
	assert.match(trigger, /\{\.\.\.triggerAttrs\}/);
	assert.doesNotMatch(trigger, /popovertarget=/);
	assert.match(popover, /\{ type: 'button' as const, popovertarget: id, disabled \}/);
	assert.match(popover, /href: disabled \? undefined : href,/);
});

test('a link trigger without href toggles by hand on click and on Enter/Space', () => {
	assert.match(popover, /function onTriggerClick[\s\S]*if \(as !== 'a'\) return;/);
	assert.match(popover, /if \(href === undefined\) \{\s*e\.preventDefault\(\);\s*toggle\(\);/);
	assert.match(popover, /function onTriggerKeydown[\s\S]*e\.key === 'Enter' \|\| e\.key === ' '/);
	assert.match(popover, /role: href === undefined \? 'button' : undefined/);
});

test('hover is wired on both trigger and panel so the pointer can cross the gap', () => {
	assert.match(popover, /onpointerenter=\{onPointerEnter\}\s*onpointerleave=\{onPointerLeave\}/);
	assert.match(popover, /onpointerenter=\{onPanelPointerEnter\}\s*onpointerleave=\{onPointerLeave\}/);
	assert.match(popover, /function onPointerEnter[\s\S]*opensOnHover\(openOn, e\.pointerType\)/);
	assert.match(popover, /hover\.enter\(hoverDelay\)/);
	assert.match(popover, /\$effect\(\(\) => \(\) => hover\.cancel\(\)\);/);
});

test('the showcase demonstrates hover mode and the link trigger', () => {
	assert.match(docs, /openOn="hover"/);
	assert.match(docs, /as="a"\s+href=/);
});
