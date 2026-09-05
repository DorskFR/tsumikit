<script lang="ts">
	// Canonical on/off toggle (role="switch") — a pill track with a sliding knob.
	// `checked` is bindable (clicking toggles it) and `onclick` still fires.
	// `label` is the accessible name; `labelVisible` renders it beside the track.
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { getFieldContext } from '$lib/field-context';

	let {
		checked = $bindable(false),
		invalid = false,
		label,
		labelVisible = false,
		size = 'md',
		onclick,
		id,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		class: klass = '',
		...rest
	}: HTMLButtonAttributes & {
		checked?: boolean;
		invalid?: boolean;
		label: string;
		/** Render `label` as visible text beside the track. */
		labelVisible?: boolean;
		size?: 'sm' | 'md';
		id?: string;
		'aria-describedby'?: string | null;
		'aria-invalid'?: HTMLButtonAttributes['aria-invalid'];
	} = $props();

	const field = getFieldContext();
	const isInvalid = $derived(invalid || !!field?.invalid);

	function toggle(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclick?.(e);
		if (e.defaultPrevented) return;
		checked = !checked;
	}
</script>

{#snippet control()}
	<button
		data-tsu="Switch"
		{...rest}
		type="button"
		class="switch {klass}"
		class:on={checked}
		class:switch-sm={size === 'sm'}
		role="switch"
		aria-checked={checked}
		id={id ?? field?.id}
		aria-describedby={ariaDescribedby ?? field?.describedBy}
		aria-invalid={ariaInvalid ?? (isInvalid ? 'true' : undefined)}
		aria-label={labelVisible ? undefined : label}
		onclick={toggle}
	>
		<span class="knob"></span>
	</button>
{/snippet}

{#if labelVisible}
	<label class="switch-row" class:switch-row-sm={size === 'sm'}>
		{@render control()}
		<span class="switch-label">{label}</span>
	</label>
{:else}
	{@render control()}
{/if}

<style>
	.switch {
		flex: none;
		width: 2.75rem;
		height: 1.6rem;
		border-radius: var(--r-pill);
		border: 1px solid var(--border-strong);
		background: var(--bg-elevated-2);
		padding: 2px;
		display: flex;
		align-items: center;
		cursor: pointer;
		transition:
			background 0.14s var(--ease),
			border-color 0.14s var(--ease);
	}
	.switch .knob {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: var(--text-muted);
		transition:
			transform 0.14s var(--ease),
			background 0.14s var(--ease);
	}
	.switch.on {
		background: var(--accent);
		border-color: var(--accent);
	}
	.switch.on .knob {
		transform: translateX(1.15rem);
		background: var(--text-on-accent);
	}
	.switch:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.switch[aria-invalid='true']:not(.on) {
		border-color: var(--danger);
	}
	.switch-sm {
		width: 2rem;
		height: 1.2rem;
	}
	.switch-sm .knob {
		width: 0.9rem;
		height: 0.9rem;
	}
	.switch-sm.on .knob {
		transform: translateX(0.8rem);
	}
	.switch-row {
		display: inline-flex;
		align-items: center;
		gap: var(--sp-2);
		cursor: pointer;
		font-size: var(--fs-sm);
		color: var(--text);
	}
	.switch-row-sm {
		font-size: var(--fs-xs);
	}
</style>
