import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { caretRect } from '../src/lib/components/molecules/combobox-keyboard.js';

/** @param {string} value @param {number} caret */
function measure(value, caret) {
	const dom = new JSDOM('<!doctype html><html><body><textarea></textarea></body></html>', {
		pretendToBeVisual: true
	});
	const w = dom.window;
	const ta = /** @type {HTMLTextAreaElement} */ (w.document.querySelector('textarea'));
	ta.value = value;
	ta.setSelectionRange(caret, caret);
	/** @type {{ marker: string, mirror: string } | null} */
	let seen = null;
	const orig = w.HTMLElement.prototype.getBoundingClientRect;
	w.HTMLElement.prototype.getBoundingClientRect = function () {
		if (this.tagName === 'SPAN' && this.parentElement) {
			seen = { marker: this.textContent ?? '', mirror: this.parentElement.textContent ?? '' };
		}
		return orig.call(this);
	};
	const rect = caretRect(ta);
	return { rect, seen };
}

test('caret mirror marker holds one character so a wrapping remainder cannot drag it to the line start', () => {
	const value = 'hello @al and then a very long tail that wraps';
	const { seen, rect } = measure(value, 9);
	assert.ok(seen);
	assert.equal(seen.marker, ' ', 'marker is the single character at the caret');
	assert.equal(seen.mirror, value, 'text after the marker still shapes line breaks');
	assert.equal(typeof rect.left, 'number');
});

test('caret at the end of the text falls back to a one-char marker', () => {
	const { seen } = measure('hello @al', 9);
	assert.ok(seen);
	assert.equal(seen.marker, '.');
	assert.equal(seen.mirror, 'hello @al.');
});
