/**
 * True while an IME composition owns the key. Safari fires `compositionend`
 * before the confirming keydown, so `isComposing` is already false there and
 * only `keyCode === 229` gives it away.
 *
 * @param {{ isComposing?: boolean, keyCode?: number }} e
 * @returns {boolean}
 */
export function isComposing(e) {
	return !!e.isComposing || e.keyCode === 229;
}
