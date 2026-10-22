<script lang="ts">
	import type { ControlSize } from '$lib/size';
	// Canonical on/off toggle (role="switch") — a pill track with a sliding knob.
	// `checked` is bindable (clicking toggles it) and `onclick` still fires.
	// `label` is the accessible name; `labelVisible` renders it beside the track.
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { getFieldContext } from '$lib/field-context';
	import { playSound } from '$lib/sound';

	let {
		checked = $bindable(false),
		invalid = false,
		label,
		labelVisible = false,
		size = 'md',
		sound = true,
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
		size?: ControlSize;
		/** Play UI sounds when enabled globally; false silences this instance. */
		sound?: boolean;
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
		playSound(checked ? 'toggle-on' : 'toggle-off', sound);
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
	/* Track and knob sit on the 4px grid: md 24 / sm 20 tall, knob = track minus
	   border and padding, travel = track width minus the knob and insets. */
	.switch {
		--sw-h: var(--chip-md);
		--sw-w: 2.75rem;
		--sw-inset: calc(var(--sp-0-5) + 1px);
		--sw-knob: calc(var(--sw-h) - 2 * var(--sw-inset));
		flex: none;
		width: var(--sw-w);
		height: var(--sw-h);
		border-radius: var(--r-pill);
		border: var(--edge-width) solid var(--border-strong);
		background: var(--track-fill);
		padding: var(--sp-0-5);
		display: flex;
		align-items: center;
		cursor: pointer;
		transition:
			background var(--dur-fast) var(--ease),
			border-color var(--dur-fast) var(--ease);
	}
	.switch .knob {
		width: var(--sw-knob);
		height: var(--sw-knob);
		border-radius: var(--r-pill);
		background: var(--text-muted);
		transform-origin: left center;
		transition:
			translate var(--dur-spring) var(--ease-spring),
			scale var(--dur-fast) var(--ease-out),
			background var(--dur-fast) var(--ease);
	}
	.switch.on {
		background: var(--accent);
		border-color: var(--accent);
	}
	.switch.on .knob {
		translate: calc(var(--sw-w) - var(--sw-knob) - 2 * var(--sw-inset)) 0;
		background: var(--text-on-accent);
		transform-origin: right center;
	}
	/* 1.12 stretch toward the travel side; derived from the press tokens so the
	   reduced-motion root (press scales = 1) flattens it to 1. */
	.switch:active:not(:disabled) .knob {
		scale: calc(1 + (var(--press-scale) - var(--press-scale-sm)) * 2.4) 1;
		transition-duration: var(--dur-press);
	}
	.switch:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
		box-shadow: var(--focus-glow);
	}
	.switch:disabled {
		opacity: var(--disabled-opacity);
		cursor: not-allowed;
	}
	.switch[aria-invalid='true']:not(.on) {
		border-color: var(--danger);
	}
	.switch-sm {
		--sw-h: var(--chip-sm);
		--sw-w: 2rem;
	}
	@media (pointer: coarse) {
		.switch {
			position: relative;
		}
		.switch::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
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
