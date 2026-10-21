<script lang="ts">
	// Checkbox primitive. A real <input type="checkbox"> (keeps native keyboard,
	// form participation and a11y) with a token-styled box and an associated
	// label. Supports `bind:checked`, `indeterminate`, and passes through every
	// native attribute via `...rest`.
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { getFieldContext } from '$lib/field-context';
	import type { ControlSize } from '$lib/size';
	import { playSound } from '$lib/sound';

	let {
		checked = $bindable(false),
		indeterminate = false,
		invalid = false,
		label,
		labelHidden = false,
		size = 'md',
		sound = true,
		id,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		class: klass = '',
		el = $bindable(null),
		onchange,
		...rest
	}: Omit<HTMLInputAttributes, 'size'> & {
		checked?: boolean;
		indeterminate?: boolean;
		/** Error state: danger box border + aria-invalid. */
		invalid?: boolean;
		label: string;
		/** Keep `label` for AT only (sr-only). */
		labelHidden?: boolean;
		/** Box + label scale, as on `Switch`. Override the box alone with
		 *  `style="--cb-box: 1rem"`. */
		size?: ControlSize;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
		id?: string;
		'aria-describedby'?: string | null;
		'aria-invalid'?: HTMLInputAttributes['aria-invalid'];
		el?: HTMLInputElement | null;
	} = $props();

	const field = getFieldContext();
	const isInvalid = $derived(invalid || !!field?.invalid);

	function change(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		onchange?.(e);
		playSound(e.currentTarget.checked ? 'toggle-on' : 'toggle-off', sound);
	}

	// `indeterminate` is a property, not an attribute — sync it imperatively.
	$effect(() => {
		if (el) el.indeterminate = indeterminate;
	});
</script>

<label
	class="checkbox {klass}"
	class:checkbox-sm={size === 'sm'}
	class:checkbox-lg={size === 'lg'}
	data-tsu="Checkbox"
>
	<input
		bind:this={el}
		type="checkbox"
		bind:checked
		{...rest}
		onchange={change}
		id={id ?? field?.id}
		aria-describedby={ariaDescribedby ?? field?.describedBy}
		aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
	/>
	<span class="box" aria-hidden="true"></span>
	<span class="label-text" class:sr-only={labelHidden}>{label}</span>
</label>

<style>
	.checkbox {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		cursor: pointer;
		font-size: var(--fs-sm);
		color: var(--text);
	}
	/* Visually hide the native control but keep it in the a11y tree + hit area. */
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		margin: 0;
	}
	.checkbox-sm {
		--cb-box: var(--chip-xs);
		font-size: var(--fs-xs);
	}
	.checkbox-lg {
		--cb-box: var(--chip-md);
		font-size: var(--fs-base);
	}
	.box {
		position: relative;
		flex: none;
		width: var(--cb-box, var(--chip-sm));
		height: var(--cb-box, var(--chip-sm));
		border: 1px solid var(--border-strong);
		border-radius: var(--r-sm);
		background: var(--bg);
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease),
			scale var(--dur-fast) var(--ease-out);
	}
	.checkbox:active:not(:has(input:disabled)) .box {
		scale: var(--press-scale-sm);
		transition-duration: var(--dur-press);
	}
	/* check mark */
	.box::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--text-on-accent);
		clip-path: polygon(41% 67%, 79% 26%, 87% 35%, 41% 84%, 15% 56%, 24% 47%);
		opacity: 0;
		scale: 0.6;
		transition:
			opacity var(--dur-exit-fast) var(--ease-out),
			scale var(--dur-exit-fast) var(--ease-out);
	}
	input:checked + .box {
		background: var(--accent);
		border-color: var(--accent);
	}
	input:checked + .box::after {
		opacity: 1;
		scale: 1;
		transition:
			opacity var(--dur-spring) var(--ease-spring),
			scale var(--dur-spring) var(--ease-spring);
	}
	/* indeterminate dash */
	input:indeterminate + .box {
		background: var(--accent);
		border-color: var(--accent);
	}
	input:indeterminate + .box::after {
		opacity: 1;
		scale: 1;
		clip-path: polygon(22% 42%, 78% 42%, 78% 58%, 22% 58%);
		transition:
			opacity var(--dur-spring) var(--ease-spring),
			scale var(--dur-spring) var(--ease-spring);
	}
	input:focus-visible + .box {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	input[aria-invalid='true']:not(:checked):not(:indeterminate) + .box {
		border-color: var(--danger);
	}
	input:disabled ~ * {
		opacity: var(--disabled-opacity);
	}
	.checkbox:has(input:disabled) {
		cursor: not-allowed;
	}
	@media (pointer: coarse) {
		.checkbox {
			position: relative;
		}
		.checkbox::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
