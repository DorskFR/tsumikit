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

export function setInputGroupContext(ctx: InputGroupContext): InputGroupContext {
	return setContext(INPUT_GROUP_KEY, ctx);
}

export function getInputGroupContext(): InputGroupContext | undefined {
	return getContext<InputGroupContext | undefined>(INPUT_GROUP_KEY);
}
