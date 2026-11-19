import { getContext, setContext } from 'svelte';
import type { ControlSize } from '$lib/size';

export const INPUT_GROUP_KEY = Symbol('tsu-input-group');

/** Read through getters so the field tracks the group's props reactively. */
export type InputGroupContext = {
	readonly size: ControlSize;
	readonly disabled: boolean;
	readonly invalid: boolean;
	readonly leadingW: number;
	readonly trailingW: number;
	/** True once the field is taller than one row: the adornments move to a
	 *  bar under the text instead of overlaying its last line. */
	readonly bar: boolean;
	setBar(bar: boolean): void;
};

const PAD_X: Record<ControlSize, string> = {
	sm: 'var(--control-px-sm)',
	md: 'var(--control-px-md)',
	lg: 'var(--control-px-lg)',
};
const GAP: Record<ControlSize, string> = {
	sm: 'var(--sp-1)',
	md: 'var(--sp-2)',
	lg: 'var(--sp-2)',
};

/** Inline padding that keeps the field's text clear of the overlaid
 *  adornments; in the bar they sit under the text, so only the tier padding is left. */
export function inputGroupPadding(group: InputGroupContext): { start: string; end: string } {
	const padX = PAD_X[group.size];
	if (group.bar) return { start: padX, end: padX };
	const clear = (width: number) => `max(${padX}, ${width}px + ${GAP[group.size]})`;
	return { start: clear(group.leadingW), end: clear(group.trailingW) };
}

export function setInputGroupContext(ctx: InputGroupContext): InputGroupContext {
	return setContext(INPUT_GROUP_KEY, ctx);
}

export function getInputGroupContext(): InputGroupContext | undefined {
	return getContext<InputGroupContext | undefined>(INPUT_GROUP_KEY);
}
