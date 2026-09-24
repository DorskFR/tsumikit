/**
 * @typedef {{ type: 'move', index: number } | { type: 'select' } | { type: 'close' }} ComboboxAction
 * @typedef {{ start: number, char: string, query: string }} ComboboxTrigger
 */

/**
 * Resolve a navigation key to the option it highlights. Arrows step by one and
 * wrap when `loop` is set; Home/End jump to the ends only when `homeEnd` is set,
 * since in a text field they move the caret by default. Unhandled keys return
 * `undefined` so the field keeps its native behaviour.
 *
 * @param {number} current
 * @param {number} count
 * @param {string} key
 * @param {{ loop?: boolean, homeEnd?: boolean }} [opts]
 * @returns {number | undefined}
 */
export function nextComboboxIndex(current, count, key, { loop = true, homeEnd = false } = {}) {
	if (count <= 0) return undefined;
	const last = count - 1;
	const cur = Number.isFinite(current) ? Math.min(Math.max(Math.trunc(current), 0), last) : 0;
	if (key === 'ArrowDown') return cur >= last ? (loop ? 0 : last) : cur + 1;
	if (key === 'ArrowUp') return cur <= 0 ? (loop ? last : 0) : cur - 1;
	if (homeEnd && key === 'Home') return 0;
	if (homeEnd && key === 'End') return last;
	return undefined;
}

/**
 * Map a keydown on the wrapped field to what the open listbox does with it.
 * Nothing is consumed while closed. Escape always closes. Enter/Tab select the
 * highlighted option only when one exists and no modifier is held, so
 * Shift+Enter (newline), Shift+Tab (focus back) and Mod+Enter (submit) pass
 * through. `undefined` means the field keeps the key.
 *
 * @param {{ key: string, shiftKey?: boolean, ctrlKey?: boolean, metaKey?: boolean, altKey?: boolean }} e
 * @param {{ open: boolean, count: number, index: number, loop?: boolean, homeEnd?: boolean, selectOn?: readonly string[] }} state
 * @returns {ComboboxAction | undefined}
 */
export function comboboxAction(
	e,
	{ open, count, index, loop, homeEnd, selectOn = ['Enter', 'Tab'] },
) {
	if (!open) return undefined;
	if (e.key === 'Escape') return { type: 'close' };
	if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return undefined;
	if (selectOn.includes(e.key)) return count > 0 ? { type: 'select' } : undefined;
	const next = nextComboboxIndex(index, count, e.key, { loop, homeEnd });
	return next === undefined ? undefined : { type: 'move', index: next };
}

/**
 * Find a `@query`-style token ending at the caret. The trigger char must start
 * the text or follow whitespace/punctuation (so `foo@bar` and `##` are not
 * triggers), and the query may not contain whitespace.
 *
 * @param {string} text
 * @param {number} caret
 * @param {string | readonly string[]} [chars]
 * @returns {ComboboxTrigger | null}
 */
export function findTrigger(text, caret, chars = '@') {
	const before = text.slice(0, Math.max(0, caret));
	const set = typeof chars === 'string' ? [...chars] : chars;
	let best = null;
	for (const char of set) {
		const at = before.lastIndexOf(char);
		if (at < 0 || (best && at < best.start)) continue;
		const query = before.slice(at + 1);
		if (/\s/.test(query)) continue;
		if (at > 0 && /[\p{L}\p{N}_]/u.test(before[at - 1])) continue;
		if (at > 0 && set.includes(before[at - 1])) continue;
		best = { start: at, char, query };
	}
	return best;
}

/**
 * Replace the trigger token under the caret with `replacement` (plus a trailing
 * space unless `suffix` says otherwise) and report where the caret lands.
 *
 * @param {string} text
 * @param {number} caret
 * @param {ComboboxTrigger} trigger
 * @param {string} replacement
 * @param {string} [suffix]
 * @returns {{ text: string, caret: number }}
 */
export function applyTrigger(text, caret, trigger, replacement, suffix = ' ') {
	const token = replacement + suffix;
	return {
		text: text.slice(0, trigger.start) + token + text.slice(caret),
		caret: trigger.start + token.length,
	};
}

const MIRROR_PROPS = [
	'box-sizing',
	'width',
	'height',
	'overflow-x',
	'overflow-y',
	'border-top-width',
	'border-right-width',
	'border-bottom-width',
	'border-left-width',
	'padding-top',
	'padding-right',
	'padding-bottom',
	'padding-left',
	'font-style',
	'font-variant',
	'font-weight',
	'font-stretch',
	'font-size',
	'font-size-adjust',
	'line-height',
	'font-family',
	'text-align',
	'text-transform',
	'text-indent',
	'text-decoration',
	'letter-spacing',
	'word-spacing',
	'tab-size',
	'white-space',
	'word-break',
	'overflow-wrap',
];

/**
 * Viewport rect of the caret in a text field, measured through an off-screen
 * mirror of the field's text and typography (fields expose no caret geometry).
 * Falls back to the field's own rect when the document cannot be measured.
 *
 * @param {HTMLInputElement | HTMLTextAreaElement} el
 * @returns {{ top: number, left: number, bottom: number, right: number, width: number, height: number }}
 */
export function caretRect(el) {
	const rect = el.getBoundingClientRect();
	const doc = el.ownerDocument;
	const view = doc.defaultView;
	if (!view || !doc.body) return rect;
	const caret = el.selectionEnd ?? el.value.length;
	const style = view.getComputedStyle(el);
	const mirror = doc.createElement('div');
	for (const prop of MIRROR_PROPS) mirror.style.setProperty(prop, style.getPropertyValue(prop));
	mirror.style.position = 'fixed';
	mirror.style.top = '0';
	mirror.style.left = '-9999px';
	mirror.style.visibility = 'hidden';
	mirror.style.pointerEvents = 'none';
	if (el instanceof view.HTMLInputElement) mirror.style.whiteSpace = 'pre';
	else {
		mirror.style.whiteSpace = 'pre-wrap';
		mirror.style.overflowY = 'hidden';
	}
	mirror.textContent = el.value.slice(0, caret);
	const marker = doc.createElement('span');
	marker.textContent = el.value.slice(caret) || '.';
	mirror.appendChild(marker);
	doc.body.appendChild(mirror);
	const m = mirror.getBoundingClientRect();
	const s = marker.getBoundingClientRect();
	mirror.remove();
	const lineHeight = Number.parseFloat(style.lineHeight) || s.height || rect.height;
	const top = rect.top + (s.top - m.top) - el.scrollTop;
	const left = rect.left + (s.left - m.left) - el.scrollLeft;
	return { top, left, width: 0, height: lineHeight, bottom: top + lineHeight, right: left };
}
