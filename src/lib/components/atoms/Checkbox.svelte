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
	let armed = $state(false);

	function change(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		armed = true;
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
	class:armed
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
	<span class="box" aria-hidden="true">
		<svg viewBox="0 0 20 20"><path class="tick" pathLength="1" d="M5.5 10.5l3 3 6-7" /></svg>
		<span class="fx"></span>
	</span>
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
		border: var(--edge-width) solid var(--control-edge);
		border-radius: var(--r-sm);
		background: var(--control-fill);
		box-shadow: var(--control-shadow);
		isolation: isolate;
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
	svg {
		position: absolute;
		inset: -1px;
		width: calc(100% + 2px);
		height: calc(100% + 2px);
		overflow: visible;
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.tick {
		stroke: var(--text-on-accent);
		stroke-width: 2.25;
		stroke-dasharray: 1 2;
		stroke-dashoffset: 1.05;
		transition: stroke-dashoffset var(--dur-exit-fast) var(--ease-out);
	}
	.fx {
		position: absolute;
		inset: 0;
		z-index: -1;
		font-size: var(--cb-box, var(--chip-sm));
		pointer-events: none;
	}
	.fx::before,
	.fx::after {
		content: '';
		position: absolute;
		opacity: 0;
	}

	/* Effects follow the closest data-fx-check ancestor; draw is the default. */
	.checkbox:not(:global([data-fx-check]:not([data-fx-check='draw'])) *),
	:global([data-fx-check='draw']) .checkbox:not(:global([data-fx-check='draw'] [data-fx-check]:not([data-fx-check='draw'])) *),
	:global([data-fx-check='pop']) .checkbox:not(:global([data-fx-check='pop'] [data-fx-check]:not([data-fx-check='pop'])) *),
	:global([data-fx-check='confetti']) .checkbox:not(:global([data-fx-check='confetti'] [data-fx-check]:not([data-fx-check='confetti'])) *) {
		& input:checked:not(:indeterminate) + .box::after {
			opacity: 0;
			transition: none;
		}
		& input:checked:not(:indeterminate) + .box .tick {
			stroke-dashoffset: 0;
			transition: stroke-dashoffset var(--dur-exit-slow) var(--ease-out) calc(var(--dur-fast) / 3);
		}
	}

	:global([data-fx-check='pop']) .checkbox:not(:global([data-fx-check='pop'] [data-fx-check]:not([data-fx-check='pop'])) *) {
		&.armed input:checked + .box {
			animation: cb-pop var(--dur-spring) var(--ease-out);
		}
	}
	@keyframes cb-pop {
		30% {
			scale: 0.8;
		}
		65% {
			scale: 1.14;
		}
	}

	:global([data-fx-check='confetti']) .checkbox:not(:global([data-fx-check='confetti'] [data-fx-check]:not([data-fx-check='confetti'])) *) {
		& .fx::before,
		& .fx::after {
			inset: -0.85em;
			border-radius: var(--r-pill);
		}
		& .fx::before {
			background:
				radial-gradient(circle at 50% 6%, var(--accent) 0 0.06em, transparent 0.08em),
				radial-gradient(circle at 94% 50%, var(--info) 0 0.06em, transparent 0.08em),
				radial-gradient(circle at 50% 94%, var(--accent) 0 0.06em, transparent 0.08em),
				radial-gradient(circle at 6% 50%, var(--ok) 0 0.06em, transparent 0.08em);
		}
		& .fx::after {
			background:
				radial-gradient(circle at 81% 19%, var(--warn) 0 0.045em, transparent 0.065em),
				radial-gradient(circle at 81% 81%, var(--accent) 0 0.045em, transparent 0.065em),
				radial-gradient(circle at 19% 81%, var(--info) 0 0.045em, transparent 0.065em),
				radial-gradient(circle at 19% 19%, var(--accent) 0 0.045em, transparent 0.065em);
		}
		&.armed input:checked:not(:indeterminate) + .box .fx::before {
			animation: cb-burst var(--dur-spring) var(--ease);
		}
		&.armed input:checked:not(:indeterminate) + .box .fx::after {
			animation: cb-burst-late var(--dur-spring) var(--ease);
		}
	}
	@keyframes cb-burst {
		0% {
			opacity: 0;
			scale: 0.35;
		}
		20%,
		60% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			scale: 1.05;
			rotate: 18deg;
		}
	}
	@keyframes cb-burst-late {
		0% {
			opacity: 0;
			scale: 0.3;
		}
		30%,
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			scale: 0.9;
			rotate: -14deg;
		}
	}

	/* Two bars, the short and long legs of the tick, fold flat into the dash. */
	:global([data-fx-check='morph']) .checkbox:not(:global([data-fx-check='morph'] [data-fx-check]:not([data-fx-check='morph'])) *) {
		& .box::after {
			display: none;
		}
		& .fx {
			z-index: 0;
		}
		& .fx::before,
		& .fx::after {
			left: 0;
			top: 0;
			height: 0.11em;
			border-radius: var(--r-pill);
			background: var(--text-on-accent);
			scale: 0;
			transition:
				opacity var(--dur-fast) var(--ease),
				translate var(--dur-spring) var(--ease-spring),
				rotate var(--dur-spring) var(--ease-spring),
				scale var(--dur-spring) var(--ease-spring);
		}
		& .fx::before {
			width: 0.26em;
			translate: 0.22em 0.545em;
			rotate: 45deg;
		}
		& .fx::after {
			width: 0.5em;
			translate: 0.325em 0.445em;
			rotate: -49deg;
		}
		& input:checked + .box .fx::before,
		& input:checked + .box .fx::after {
			opacity: 1;
			scale: 1;
		}
		& input:indeterminate + .box .fx::before {
			opacity: 1;
			translate: 0.37em 0.445em;
			rotate: 0deg;
			scale: 1;
		}
		& input:indeterminate + .box .fx::after {
			opacity: 1;
			translate: 0.25em 0.445em;
			rotate: 0deg;
			scale: 1;
		}
	}

	input:focus-visible + .box {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
		box-shadow: var(--control-shadow), var(--focus-glow);
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
