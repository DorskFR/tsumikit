import { getContext, setContext } from 'svelte';

export const FIELD_KEY = Symbol('tsu-field');

export type FieldContext = {
	id: string;
	describedBy?: string;
	invalid: boolean;
};

export function setFieldContext(ctx: FieldContext): FieldContext {
	return setContext(FIELD_KEY, ctx);
}

export function getFieldContext(): FieldContext | undefined {
	return getContext<FieldContext | undefined>(FIELD_KEY);
}

const warned = new WeakSet<Element>();

export function warnUnlabelled(el: HTMLElement | null | undefined, name: string): void {
	if (!import.meta.env.DEV || !el || typeof document === 'undefined') return;
	if (warned.has(el)) return;
	if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return;
	if (el.closest('label')) return;
	const id = el.id;
	if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) return;
	warned.add(el);
	console.warn(`[tsumikit] <${name}> rendered without an accessible label`);
}
