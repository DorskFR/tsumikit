export const TOOLBAR_STOP_SELECTOR =
	'button, a[href], input, select, textarea, summary, [tabindex]';

/** Marks a control the toolbar has taken over, so its `-1` reads as ours, not the author's. */
export const TOOLBAR_STOP_ATTR = 'data-toolbar-stop';

const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

const ARROW_CONSUMING_INPUTS = new Set([
	'text',
	'search',
	'email',
	'url',
	'tel',
	'password',
	'number',
	'date',
	'datetime-local',
	'month',
	'week',
	'time',
	'range',
	'radio',
]);

/** @param {string} key */
export function isToolbarNavKey(key) {
	return NAV_KEYS.has(key);
}

/**
 * Controls that own the arrow keys themselves (caret, spinner, native listbox):
 * the toolbar must not steal them.
 *
 * @param {{ tagName?: string; type?: string; isContentEditable?: boolean } | null | undefined} el
 */
export function consumesArrowKeys(el) {
	if (!el) return false;
	if (el.isContentEditable) return true;
	const tag = (el.tagName ?? '').toLowerCase();
	if (tag === 'textarea' || tag === 'select') return true;
	if (tag !== 'input') return false;
	return ARROW_CONSUMING_INPUTS.has((el.type ?? 'text').toLowerCase());
}

/**
 * @param {{
 *   disabled?: boolean;
 *   hidden?: boolean;
 *   ariaHidden?: boolean;
 *   inPopover?: boolean;
 *   tabindex?: string | null;
 *   claimed?: boolean;
 * }} el
 */
export function acceptsRovingStop(el) {
	if (el.disabled || el.hidden || el.ariaHidden || el.inPopover) return false;
	return el.claimed === true || el.tabindex !== '-1';
}

/**
 * The ring, in DOM order. `isHidden` is injected because "has no box" is the only
 * honest test for a collapsed child and it cannot be computed without layout.
 *
 * @param {Element | null} container
 * @param {(node: HTMLElement) => boolean} isHidden
 * @returns {HTMLElement[]}
 */
export function toolbarStops(container, isHidden) {
	if (!container) return [];
	const stops = [
		.../** @type {NodeListOf<HTMLElement>} */ (container.querySelectorAll(TOOLBAR_STOP_SELECTOR)),
	].filter((node) =>
		acceptsRovingStop({
			disabled: /** @type {HTMLButtonElement} */ (node).disabled,
			hidden: node.hidden || isHidden(node),
			ariaHidden: node.getAttribute('aria-hidden') === 'true',
			inPopover: node.closest('[popover]') !== null,
			tabindex: node.getAttribute('tabindex'),
			claimed: node.hasAttribute(TOOLBAR_STOP_ATTR),
		}),
	);
	return oneStopPerRadioGroup(stops);
}

/** @param {HTMLElement} node */
function radioName(node) {
	const input = /** @type {HTMLInputElement} */ (node);
	return node.tagName === 'INPUT' && input.type === 'radio' && input.name ? input.name : null;
}

/**
 * A named radio group is a single stop, like a native one: its checked radio,
 * else its first. The arrows inside it stay the browser's.
 *
 * @param {HTMLElement[]} stops
 * @returns {HTMLElement[]}
 */
export function oneStopPerRadioGroup(stops) {
	/** @type {Map<string, HTMLElement>} */
	const picked = new Map();
	for (const node of stops) {
		const name = radioName(node);
		if (name === null) continue;
		const current = /** @type {HTMLInputElement | undefined} */ (picked.get(name));
		if (!current || (!current.checked && /** @type {HTMLInputElement} */ (node).checked))
			picked.set(name, node);
	}
	return stops.filter((node) => {
		const name = radioName(node);
		return name === null || picked.get(name) === node;
	});
}

/**
 * The other radios sharing `node`'s group inside `container`.
 *
 * @param {HTMLElement} node
 * @param {Element | null} container
 * @returns {HTMLElement[]}
 */
export function radioGroupPeers(node, container) {
	const name = radioName(node);
	if (name === null || !container) return [];
	return [
		.../** @type {NodeListOf<HTMLElement>} */ (container.querySelectorAll('input[type="radio"]')),
	].filter((peer) => peer !== node && radioName(peer) === name);
}

/**
 * Arrows wrap; Home/End jump to the ends. `undefined` means "not ours" — the
 * caller must leave the event alone.
 *
 * @param {number} count
 * @param {number} current
 * @param {string} key
 * @returns {number | undefined}
 */
export function nextToolbarStop(count, current, key) {
	if (count <= 0 || current < 0 || current >= count) return undefined;
	if (key === 'Home') return 0;
	if (key === 'End') return count - 1;

	let direction;
	if (key === 'ArrowRight' || key === 'ArrowDown') direction = 1;
	else if (key === 'ArrowLeft' || key === 'ArrowUp') direction = -1;
	else return undefined;

	return (((current + direction) % count) + count) % count;
}
