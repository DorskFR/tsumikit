<script lang="ts">
	/**
	 * "1:02 / 23:45" readout with tabular numbers. Clicking it shows the
	 * remaining time instead ("-22:43 / 23:45"). Live or unknown durations
	 * render the position only and cannot be toggled.
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { formatMediaTime, isLiveDuration } from '$lib/media-time';

	type Own = {
		/** Position in seconds. */
		current?: number;
		/** Duration in seconds; `null`/`Infinity` = live or unknown. */
		duration?: number | null;
		/** Show time left instead of the position. */
		remaining?: boolean;
		/** Allow clicking to toggle `remaining`. */
		toggle?: boolean;
		size?: 'sm' | 'md';
		formatTime?: (seconds: number, ref?: number) => string;
		toggleLabel?: string;
		class?: string;
	};

	let {
		current = 0,
		duration = null,
		remaining = $bindable(false),
		toggle = true,
		size = 'sm',
		formatTime = formatMediaTime,
		toggleLabel = 'Toggle remaining time',
		class: klass = '',
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();

	const live = $derived(isLiveDuration(duration));
	const total = $derived(live ? 0 : (duration as number));
	const pos = $derived(Math.min(live ? Number.POSITIVE_INFINITY : total, Math.max(0, current)));
	const head = $derived(live ? formatTime(pos) : remaining ? `-${formatTime(total - pos, total)}` : formatTime(pos, total));
	const tail = $derived(live ? null : formatTime(total, total));
	const interactive = $derived(toggle && !live);
</script>

{#if interactive}
	<button
		data-tsu="TimeDisplay"
		type="button"
		class="td td--{size} td--button {klass}"
		class:td--remaining={remaining}
		title={toggleLabel}
		aria-pressed={remaining}
		onclick={() => (remaining = !remaining)}
		{...rest}
	>
		<span data-part="position">{head}</span><span class="td-sep" aria-hidden="true">{' / '}</span><span data-part="duration">{tail}</span>
	</button>
{:else}
	<span data-tsu="TimeDisplay" class="td td--{size} {klass}" {...rest}>
		<span data-part="position">{head}</span>{#if tail !== null}<span class="td-sep" aria-hidden="true">{' / '}</span><span data-part="duration">{tail}</span>{/if}
	</span>
{/if}

<style>
	.td {
		display: inline-flex;
		align-items: baseline;
		font-size: var(--fs-sm);
		font-variant-numeric: tabular-nums;
		color: var(--text-muted);
		white-space: nowrap;
	}
	.td--md {
		font-size: var(--fs-base);
	}
	.td--button {
		border: 0;
		background: none;
		padding: 0;
		margin: 0;
		font: inherit;
		font-variant-numeric: tabular-nums;
		color: inherit;
		cursor: pointer;
		border-radius: var(--r-sm);
	}
	@media (hover: hover) and (pointer: fine) {
		.td--button:hover {
			color: var(--text);
		}
	}
	.td--button:focus-visible {
		outline: var(--focus-ring);
		outline-offset: var(--focus-ring-offset);
	}
	.td-sep {
		color: var(--text-faint);
		white-space: pre;
	}
</style>
