import { getContext, setContext } from 'svelte';
import type { ControlSize } from '$lib/size';

export const CONTROL_SIZE_KEY = Symbol('tsu-control-size');

/** Read through a getter so controls track the provider's `size` reactively. */
export type ControlSizeContext = {
	readonly size: ControlSize | undefined;
};

export function setControlSizeContext(ctx: ControlSizeContext): ControlSizeContext {
	return setContext(CONTROL_SIZE_KEY, ctx);
}

export function getControlSizeContext(): ControlSizeContext | undefined {
	return getContext<ControlSizeContext | undefined>(CONTROL_SIZE_KEY);
}

/** Height tier of a `control` inside a sized provider: its own `size` when
 *  given, else the provider's. `undefined` outside one (`--control-height`). */
export function controlTier(
	control: boolean,
	size: ControlSize | 'xl' | undefined,
	ctx: ControlSizeContext | undefined,
): ControlSize | undefined {
	if (!control || !ctx?.size) return undefined;
	return size && size !== 'xl' ? size : ctx.size;
}
