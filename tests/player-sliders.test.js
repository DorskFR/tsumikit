import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { describeMediaTime, formatMediaTime, isLiveDuration } from '../src/lib/media-time.ts';
import { buildFixture } from './fixtures/build.mjs';
import { hasDecl, normalize } from './helpers.mjs';

const read = (/** @type {string} */ p) => readFile(new URL(p, import.meta.url), 'utf8');
const seekSrc = await read('../src/lib/components/molecules/SeekSlider.svelte');
const volSrc = await read('../src/lib/components/molecules/VolumeSlider.svelte');
const tdSrc = await read('../src/lib/components/atoms/TimeDisplay.svelte');
const seekCss = seekSrc.slice(seekSrc.indexOf('<style>'));
const volCss = volSrc.slice(volSrc.indexOf('<style>'));
const bundle = await buildFixture('mount-player-sliders.svelte.js');

const WIDTH = 400;
const LEFT = 100;
const DUR = 1425;

/** @param {Record<string, unknown>} init */
function render(init = {}) {
	const dom = new JSDOM('<!doctype html><html><body></body></html>', {
		runScripts: 'outside-only',
		pretendToBeVisual: true
	});
	const w = dom.window;
	if (typeof w.PointerEvent !== 'function') {
		w.PointerEvent = class PointerEvent extends w.MouseEvent {
			/** @param {string} type @param {PointerEventInit} [init] */
			constructor(type, init = {}) {
				super(type, init);
				this.pointerId = init.pointerId ?? 1;
				this.pointerType = init.pointerType ?? 'touch';
			}
		};
	}
	/** @type {number[]} */
	const captured = [];
	w.Element.prototype.setPointerCapture = function (/** @type {number} */ id) {
		captured.push(id);
	};
	w.Element.prototype.releasePointerCapture = () => {};
	w.eval(bundle);
	const { mount, unmount, flushSync, Fixture, props } = w.__fixture;
	const live = props({ log: [], value: 62, volume: 0.8, muted: false, remaining: false, ...init });
	const app = mount(Fixture, { target: w.document.body, props: live });
	flushSync();
	const doc = w.document;
	const seek = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="SeekSlider"]'));
	const vol = /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="VolumeSlider"]'));
	const volSlab = /** @type {HTMLElement} */ (vol.querySelector('[data-part="slab"]'));
	const mute = /** @type {HTMLButtonElement} */ (vol.querySelector('[data-part="mute"]'));
	const td = () => /** @type {HTMLElement} */ (doc.querySelector('[data-tsu="TimeDisplay"]'));
	for (const el of [seek, volSlab]) {
		el.getBoundingClientRect = () => ({
			left: LEFT,
			top: 0,
			width: WIDTH,
			height: 20,
			right: LEFT + WIDTH,
			bottom: 20,
			x: LEFT,
			y: 0,
			toJSON() {}
		});
	}
	const pointer = (/** @type {HTMLElement} */ el, /** @type {string} */ type, /** @type {number} */ x, y = 10, id = 7) => {
		el.dispatchEvent(
			new w.PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: id, clientX: x, clientY: y })
		);
		flushSync();
	};
	const key = (/** @type {HTMLElement} */ el, /** @type {string} */ k) => {
		const ev = new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
		el.dispatchEvent(ev);
		flushSync();
		return ev.defaultPrevented;
	};
	const click = (/** @type {Element} */ el) => {
		el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
		flushSync();
	};
	const wheel = (/** @type {HTMLElement} */ el, /** @type {number} */ dy) => {
		const ev = new w.WheelEvent('wheel', { deltaY: dy, bubbles: true, cancelable: true });
		el.dispatchEvent(ev);
		flushSync();
		return ev.defaultPrevented;
	};
	const log = () => [...live.log];
	const clear = () => live.log.splice(0);
	const destroy = () => {
		unmount(app);
		flushSync();
	};
	return { w, doc, seek, vol, volSlab, mute, td, pointer, key, click, wheel, captured, log, clear, destroy, props: live, flush: flushSync };
}

const xAt = (/** @type {number} */ f) => LEFT + WIDTH * f;

test('formatMediaTime: m:ss by default, h:mm:ss past an hour or when the reference is', () => {
	assert.equal(formatMediaTime(62), '1:02');
	assert.equal(formatMediaTime(0), '0:00');
	assert.equal(formatMediaTime(3599), '59:59');
	assert.equal(formatMediaTime(3600), '1:00:00');
	assert.equal(formatMediaTime(62, 3600), '0:01:02');
	assert.equal(formatMediaTime(62.9), '1:02');
	assert.equal(formatMediaTime(-83), '-1:23');
	assert.equal(formatMediaTime(Number.POSITIVE_INFINITY), '--:--');
	assert.equal(formatMediaTime(Number.NaN), '--:--');
	assert.equal(describeMediaTime(62, 1425), '1:02 of 23:45');
	assert.equal(describeMediaTime(62, null), '1:02');
	assert.equal(describeMediaTime(62, Number.POSITIVE_INFINITY), '1:02');
	assert.ok(isLiveDuration(null) && isLiveDuration(Number.POSITIVE_INFINITY) && isLiveDuration(0) && !isLiveDuration(10));
});

test('SeekSlider exposes the slider role with a spoken "position of duration" value', () => {
	const r = render();
	assert.equal(r.seek.getAttribute('role'), 'slider');
	assert.equal(r.seek.getAttribute('tabindex'), '0');
	assert.equal(r.seek.getAttribute('aria-valuemin'), '0');
	assert.equal(r.seek.getAttribute('aria-valuemax'), String(DUR));
	assert.equal(r.seek.getAttribute('aria-valuenow'), '62');
	assert.equal(r.seek.getAttribute('aria-valuetext'), '1:02 of 23:45');
	assert.equal(r.seek.getAttribute('aria-orientation'), 'horizontal');
	assert.equal(r.seek.getAttribute('aria-label'), 'Seek');
	assert.equal(r.seek.style.getPropertyValue('--pct').trim(), String((62 / DUR) * 100));
	r.destroy();
});

test('dragging previews through oninput and seeks exactly once on release', () => {
	const r = render();
	r.pointer(r.seek, 'pointerdown', xAt(0.25));
	assert.ok(r.seek.classList.contains('seek--dragging'));
	assert.equal(r.doc.activeElement, r.seek, 'the slab takes focus on press');
	assert.deepEqual(r.captured, [7]);
	assert.deepEqual(r.log(), ['scrubstart', `input:${Math.round(DUR * 0.25)}`]);
	assert.equal(r.props.value, 62, 'the bound value does not move while dragging');
	r.pointer(r.seek, 'pointermove', xAt(0.5));
	r.pointer(r.seek, 'pointermove', xAt(0.75));
	assert.equal(r.props.value, 62);
	assert.equal(r.seek.getAttribute('aria-valuenow'), String(DUR * 0.75));
	assert.equal(r.seek.style.getPropertyValue('--pct').trim(), '75');
	assert.ok(r.seek.querySelector('[data-part="tip"]'), 'tooltip shows while dragging');
	assert.equal(r.seek.querySelector('[data-part="tip"]')?.textContent?.trim(), formatMediaTime(DUR * 0.75));
	r.pointer(r.seek, 'pointerup', xAt(0.75));
	r.pointer(r.seek, 'lostpointercapture', xAt(0.75));
	assert.equal(r.props.value, DUR * 0.75);
	assert.deepEqual(r.log().filter((l) => l.startsWith('change')), [`change:${Math.round(DUR * 0.75)}`]);
	assert.deepEqual(r.log().filter((l) => l.startsWith('scrub')), ['scrubstart', 'scrubend']);
	assert.ok(!r.seek.classList.contains('seek--dragging'));
	r.destroy();
});

test('a drag beyond the track edges clamps to 0 and the duration', () => {
	const r = render();
	r.pointer(r.seek, 'pointerdown', xAt(0.5));
	r.pointer(r.seek, 'pointermove', xAt(2));
	r.pointer(r.seek, 'pointerup', xAt(2));
	assert.equal(r.props.value, DUR);
	r.pointer(r.seek, 'pointerdown', xAt(0.5));
	r.pointer(r.seek, 'pointermove', xAt(-1));
	r.pointer(r.seek, 'pointerup', xAt(-1));
	assert.equal(r.props.value, 0);
	assert.equal(r.log().filter((l) => l.startsWith('change')).length, 2);
	r.destroy();
});

test('a different pointer during a drag is ignored and pointercancel reverts without seeking', () => {
	const r = render();
	r.pointer(r.seek, 'pointerdown', xAt(0.25));
	r.pointer(r.seek, 'pointermove', xAt(0.9), 10, 9);
	assert.equal(r.seek.getAttribute('aria-valuenow'), String(DUR * 0.25));
	r.pointer(r.seek, 'pointercancel', xAt(0.25));
	assert.equal(r.props.value, 62);
	assert.deepEqual(r.log().filter((l) => !l.startsWith('input')), ['scrubstart', 'scrubend']);
	assert.equal(r.seek.getAttribute('aria-valuenow'), '62');
	r.destroy();
});

test('keyboard: arrows step, PageUp/Down jump a fraction, Home/End hit the bounds, each committing once', () => {
	const r = render();
	assert.ok(r.key(r.seek, 'ArrowRight'));
	assert.equal(r.props.value, 67);
	assert.ok(r.key(r.seek, 'ArrowLeft'));
	assert.ok(r.key(r.seek, 'ArrowUp'));
	assert.ok(r.key(r.seek, 'ArrowDown'));
	assert.equal(r.props.value, 62);
	assert.ok(r.key(r.seek, 'PageUp'));
	assert.equal(r.props.value, 62 + DUR * 0.1);
	assert.ok(r.key(r.seek, 'PageDown'));
	assert.equal(r.props.value, 62);
	assert.ok(r.key(r.seek, 'End'));
	assert.equal(r.props.value, DUR);
	assert.ok(r.key(r.seek, 'Home'));
	assert.equal(r.props.value, 0);
	assert.ok(!r.key(r.seek, 'a'));
	assert.deepEqual(r.log(), ['change:67', 'change:62', 'change:67', 'change:62', `change:${Math.round(62 + DUR * 0.1)}`, 'change:62', `change:${DUR}`, 'change:0']);
	r.destroy();
});

test('buffered ranges render as muted fills with clamped percentages', () => {
	const r = render({ buffered: [[0, DUR / 4], [DUR / 2, DUR * 2], [DUR, DUR]] });
	const fills = [...r.seek.querySelectorAll('[data-part="buffered"]')];
	assert.equal(fills.length, 2, 'empty and inverted ranges are dropped');
	assert.equal(/** @type {HTMLElement} */ (fills[0]).style.getPropertyValue('--a').trim(), '0');
	assert.equal(/** @type {HTMLElement} */ (fills[0]).style.getPropertyValue('--b').trim(), '25');
	assert.equal(/** @type {HTMLElement} */ (fills[1]).style.getPropertyValue('--a').trim(), '50');
	assert.equal(/** @type {HTMLElement} */ (fills[1]).style.getPropertyValue('--b').trim(), '100');
	assert.ok(r.seek.querySelector('[data-part="played"]'));
	r.props.buffered = [[0, DUR]];
	r.flush();
	assert.equal(r.seek.querySelectorAll('[data-part="buffered"]').length, 1);
	r.destroy();
});

test('hover shows the time under the pointer and the preview snippet; leaving hides it', () => {
	const r = render({ withPreview: true });
	assert.equal(r.seek.querySelector('[data-part="tip"]'), null);
	r.pointer(r.seek, 'pointermove', xAt(0.5), 10, 3);
	const tip = r.seek.querySelector('[data-part="tip"]');
	assert.ok(tip);
	assert.equal(tip.querySelector('.seek-tip-time')?.textContent, formatMediaTime(DUR / 2));
	assert.equal(tip.querySelector('.probe-preview')?.textContent, `thumb@${Math.round(DUR / 2)}`);
	assert.equal(r.seek.style.getPropertyValue('--tip').trim(), '50');
	assert.deepEqual(r.log(), [], 'hover never emits');
	r.pointer(r.seek, 'pointerleave', xAt(0.5), 10, 3);
	assert.equal(r.seek.querySelector('[data-part="tip"]'), null);
	r.destroy();
});

test('live or unknown duration disables the track: no tab stop, no drag, no keys', () => {
	for (const max of [null, Number.POSITIVE_INFINITY, 0]) {
		const r = render({ max });
		assert.equal(r.seek.getAttribute('aria-disabled'), 'true');
		assert.equal(r.seek.getAttribute('tabindex'), '-1');
		assert.ok(r.seek.classList.contains('seek--inert'));
		assert.equal(r.seek.getAttribute('aria-valuetext'), '1:02');
		r.pointer(r.seek, 'pointerdown', xAt(0.5));
		r.pointer(r.seek, 'pointerup', xAt(0.5));
		r.key(r.seek, 'ArrowRight');
		assert.deepEqual(r.log(), []);
		assert.equal(r.props.value, 62);
		assert.deepEqual(r.captured, []);
		r.destroy();
	}
	const r = render({ disabled: true });
	assert.equal(r.seek.getAttribute('aria-disabled'), 'true');
	r.key(r.seek, 'End');
	assert.deepEqual(r.log(), []);
	r.destroy();
});

test('an RTL slider maps the pointer from the right edge', () => {
	const r = render();
	r.w.getComputedStyle = () => /** @type {CSSStyleDeclaration} */ (/** @type {unknown} */ ({ direction: 'rtl' }));
	r.pointer(r.seek, 'pointerdown', xAt(0.25));
	r.pointer(r.seek, 'pointerup', xAt(0.25));
	assert.equal(r.props.value, DUR * 0.75);
	r.destroy();
});

test('VolumeSlider: mute toggle flips the glyph and aria, dragging changes the level live, committing once', () => {
	const r = render();
	assert.equal(r.volSlab.getAttribute('role'), 'slider');
	assert.equal(r.volSlab.getAttribute('aria-valuenow'), '80');
	assert.equal(r.volSlab.getAttribute('aria-valuetext'), '80%');
	assert.equal(r.mute.getAttribute('aria-pressed'), 'false');
	assert.equal(r.mute.getAttribute('aria-label'), 'Mute');
	assert.match(r.mute.innerHTML, /M19\.364 18\.364a9 9 0 0 0 0-12\.728/, 'high glyph at 80%');
	r.click(r.mute);
	assert.equal(r.props.muted, true);
	assert.equal(r.mute.getAttribute('aria-pressed'), 'true');
	assert.equal(r.mute.getAttribute('aria-label'), 'Unmute');
	assert.equal(r.volSlab.getAttribute('aria-valuenow'), '0');
	assert.equal(r.volSlab.getAttribute('aria-valuetext'), 'Muted');
	assert.match(r.mute.innerHTML, /m22 9-6 6/, 'muted glyph');
	assert.deepEqual(r.log(), ['mute:true']);
	r.clear();
	r.pointer(r.volSlab, 'pointerdown', xAt(0.3));
	assert.equal(r.props.muted, false, 'changing the level unmutes');
	assert.equal(r.props.volume, 0.3);
	r.pointer(r.volSlab, 'pointermove', xAt(0.2));
	assert.equal(r.props.volume, 0.2);
	assert.match(r.mute.innerHTML, /M16 9a5 5 0 0 1 0 6/, 'low glyph');
	assert.doesNotMatch(r.mute.innerHTML, /M19\.364 18\.364/);
	r.pointer(r.volSlab, 'pointerup', xAt(0.2));
	assert.deepEqual(r.log(), ['mute:false', 'vinput:30', 'vinput:20', 'vchange:20']);
	r.destroy();
});

test('VolumeSlider: arrows and wheel step by 5% and commit each; wheel is consumed', () => {
	const r = render();
	assert.ok(r.key(r.volSlab, 'ArrowUp'));
	assert.equal(r.props.volume, 0.85);
	assert.ok(r.key(r.volSlab, 'ArrowLeft'));
	assert.equal(r.props.volume, 0.8);
	assert.ok(r.key(r.volSlab, 'End'));
	assert.equal(r.props.volume, 1);
	assert.ok(r.key(r.volSlab, 'Home'));
	assert.equal(r.props.volume, 0);
	assert.match(r.mute.innerHTML, /M11 4\.702a/);
	assert.doesNotMatch(r.mute.innerHTML, /M16 9a5 5 0 0 1 0 6|m22 9-6 6/, 'plain glyph at zero');
	assert.ok(r.wheel(r.volSlab, -100));
	assert.equal(r.props.volume, 0.05);
	assert.ok(r.wheel(r.volSlab, 100));
	assert.equal(r.props.volume, 0);
	assert.ok(!r.wheel(r.volSlab, 0));
	assert.deepEqual(
		r.log().filter((l) => l.startsWith('vchange')),
		['vchange:85', 'vchange:80', 'vchange:100', 'vchange:0', 'vchange:5', 'vchange:0']
	);
	r.destroy();
});

test('VolumeSlider: vertical orientation reads the y axis bottom-up', () => {
	const r = render({ orientation: 'vertical' });
	assert.equal(r.volSlab.getAttribute('aria-orientation'), 'vertical');
	r.pointer(r.volSlab, 'pointerdown', LEFT, 5);
	r.pointer(r.volSlab, 'pointerup', LEFT, 5);
	assert.equal(r.props.volume, 0.75);
	r.destroy();
});

test('VolumeSlider: disabled ignores pointer, keys and wheel', () => {
	const r = render({ disabled: true });
	assert.equal(r.volSlab.getAttribute('tabindex'), '-1');
	assert.ok(r.mute.disabled);
	r.pointer(r.volSlab, 'pointerdown', xAt(0.3));
	r.pointer(r.volSlab, 'pointerup', xAt(0.3));
	r.key(r.volSlab, 'ArrowUp');
	r.wheel(r.volSlab, -100);
	assert.deepEqual(r.log(), []);
	assert.equal(r.props.volume, 0.8);
	r.destroy();
});

test('TimeDisplay shows "position / duration", toggles to remaining on click, and is inert when live', () => {
	const r = render();
	let el = r.td();
	assert.equal(el.tagName, 'BUTTON');
	assert.equal(el.getAttribute('type'), 'button');
	assert.equal(el.getAttribute('aria-pressed'), 'false');
	assert.equal(el.textContent, '1:02 / 23:45');
	r.click(el);
	assert.equal(r.props.remaining, true);
	el = r.td();
	assert.equal(el.getAttribute('aria-pressed'), 'true');
	assert.equal(el.textContent, '-22:43 / 23:45');
	r.key(r.seek, 'End');
	assert.equal(r.td().textContent, '-0:00 / 23:45');
	r.props.max = null;
	r.flush();
	el = r.td();
	assert.equal(el.tagName, 'SPAN');
	assert.equal(el.textContent, '23:45');
	assert.equal(el.querySelector('[data-part="duration"]'), null);
	r.destroy();
});

test('CSS contracts: touch-action none, thin track, coarse slab, hidden thumb, reduced motion, tokens only', () => {
	assert.ok(hasDecl(seekCss, '.seek', 'touch-action', 'none'));
	assert.ok(hasDecl(seekCss, '.seek', '--seek-track', '3px'));
	assert.ok(hasDecl(seekCss, '.seek--md', '--seek-track', '4px'));
	assert.ok(hasDecl(seekCss, '.seek', 'min-height', 'var(--seek-slab)'));
	assert.ok(hasDecl(seekCss, '.seek-thumb', 'opacity', '0'));
	assert.ok(hasDecl(seekCss, '.seek-track', 'inset-inline', '0'));
	assert.ok(hasDecl(seekCss, '.seek-anchor--thumb', 'inset-inline-start', 'calc(var(--pct) * 1%)'));
	const flatSeek = normalize(seekCss);
	assert.match(flatSeek, /@media \(pointer: coarse\) { \.seek { min-height: var\(--touch-target-compact\); } }/);
	assert.match(flatSeek, /@media \(prefers-reduced-motion: reduce\) { \.seek-track, \.seek-thumb { transition: none; } }/);
	assert.match(flatSeek, /\.seek:hover \.seek-thumb, \.seek:focus-visible \.seek-thumb, \.seek--dragging \.seek-thumb { opacity: 1;/);
	assert.ok(hasDecl(volCss, '.vol-slab', 'touch-action', 'none'));
	const flatVol = normalize(volCss);
	assert.match(flatVol, /@media \(hover: none\) and \(pointer: coarse\) { \.vol--hide-touch \.vol-slab { display: none; } }/);
	assert.match(flatVol, /@media \(pointer: coarse\) { \.vol-slab { min-height: var\(--touch-target-compact\); }/);
	assert.match(flatVol, /@media \(prefers-reduced-motion: reduce\) { \.vol-thumb { transition: none; } }/);
	for (const css of [seekCss, volCss, tdSrc.slice(tdSrc.indexOf('<style>'))]) {
		assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b|rgba?\(/i, 'no raw colours');
	}
	assert.match(tdSrc, /font-variant-numeric: tabular-nums/);
});

test('the components touch no browser globals at module or init time', () => {
	for (const src of [seekSrc, volSrc, tdSrc]) {
		const script = src.slice(0, src.indexOf('</script>', src.indexOf('<script lang="ts">')));
		const top = script
			.split('\n')
			.filter((l) => /^\t(let|const) /.test(l))
			.join('\n');
		assert.doesNotMatch(top, /\b(window|document|matchMedia|navigator|getComputedStyle)\b/);
	}
});
