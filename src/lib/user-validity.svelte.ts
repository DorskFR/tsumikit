import type { Attachment } from 'svelte/attachments';
import { browser } from '$lib/env';
import type { FieldContext } from '$lib/field-context';

type Constrained = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type UserValidity = Attachment<Constrained> & { refresh(): void };

/** Reports the validation message whenever `:user-invalid` would match, else `null`. */
export function userValidity(report: (message: string | null) => void): UserValidity {
	let node: Constrained | null = null;
	let touched = false;
	let last: string | null = null;
	const emit = (message: string | null) => {
		if (message === last) return;
		last = message;
		report(message);
	};
	const check = () => {
		if (!node || !touched || !node.willValidate) return emit(null);
		emit(node.validity.valid ? null : node.validationMessage || 'Invalid value');
	};
	const commit = () => {
		touched = true;
		check();
	};
	const reset = () => {
		touched = false;
		emit(null);
	};
	const attach: Attachment<Constrained> = (el) => {
		node = el;
		const form = el.form;
		el.addEventListener('change', commit);
		el.addEventListener('blur', commit);
		el.addEventListener('invalid', commit);
		el.addEventListener('input', check);
		form?.addEventListener('reset', reset);
		return () => {
			el.removeEventListener('change', commit);
			el.removeEventListener('blur', commit);
			el.removeEventListener('invalid', commit);
			el.removeEventListener('input', check);
			form?.removeEventListener('reset', reset);
			if (node === el) node = null;
			touched = false;
			emit(null);
		};
	};
	return Object.assign(attach, { refresh: check });
}

/** Wires `userValidity` to a control: tracks its bound value and reports to the enclosing Field. */
export function controlValidity(field: FieldContext | undefined, value: () => unknown) {
	let message = $state<string | null>(null);
	const attach = userValidity((m) => (message = m));
	if (browser) {
		$effect(() => {
			value();
			attach.refresh();
		});
		$effect(() => {
			const report = field?.report;
			if (!report) return;
			report(message);
			return () => report(null);
		});
	}
	return {
		attach,
		get invalid() {
			return message !== null;
		},
	};
}
