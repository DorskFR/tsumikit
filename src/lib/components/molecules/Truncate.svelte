<script lang="ts">
	// Character-count truncation with a hover/focus reveal of the full text.
	// Thin wrapper over the `truncate()` helper (the truncation logic lives there
	// and stays unit-testable) plus Tooltip (the reveal). When the text already
	// fits, it renders as a bare inline span with no tooltip wiring at all — so
	// you only pay for the Tooltip when something is actually hidden.
	//
	// `fit` swaps the character budget for a measured one: the host width is
	// observed and the longest candidate that fits is shown (mode `path`
	// abbreviates fish-style). `copyable` copies the full text on click.
	import { copyToClipboard } from '$lib/clipboard';
	import { pathCandidates, truncate, type TruncateMode } from '$lib/truncate';
	import Tooltip from './Tooltip.svelte';

	let {
		text,
		max,
		mode = 'end',
		ellipsis = '…',
		separator = '/',
		minLeaf = 3,
		keepFirst = 0,
		fit = false,
		mono = false,
		copyable = false,
		copiedLabel = 'Copied',
		oncopy,
		grow = false,
		tooltip = true,
		placement = 'top',
		class: klass = '',
		style: styleProp = '',
	}: {
		text: string;
		/** Character budget. Ignored when `fit` is set. */
		max?: number;
		mode?: TruncateMode;
		ellipsis?: string;
		/** `path` mode options. */
		separator?: string;
		minLeaf?: number;
		keepFirst?: number;
		/** Measure the host width and show the longest candidate that fits. */
		fit?: boolean;
		mono?: boolean;
		/** Click copies the full text; announces via a live region. */
		copyable?: boolean;
		copiedLabel?: string;
		oncopy?: (ok: boolean) => void;
		/** `flex: 1 1 0; min-width: 0` so the host claims a flex row's free space. */
		grow?: boolean;
		/** Reveal the full text on hover/focus when truncated. Default true. */
		tooltip?: boolean;
		placement?: 'top' | 'bottom' | 'left' | 'right';
		class?: string;
		style?: string;
	} = $props();

	const pathOpts = $derived({ ellipsis, separator, minLeaf, keepFirst });

	const candidates = $derived.by(() => {
		if (mode === 'path') return pathCandidates(text, pathOpts);
		const out: string[] = [];
		for (let m = [...text].length; m >= 2; m--) {
			const c = truncate(text, { max: m, mode, ellipsis });
			if (out[out.length - 1] !== c) out.push(c);
		}
		return out;
	});

	let rail = $state<HTMLSpanElement | null>(null);
	let probe = $state<HTMLSpanElement | null>(null);
	let avail = $state(Number.POSITIVE_INFINITY);
	let chPx = $state(8);

	$effect(() => {
		if (!fit || !rail) return;
		const el = rail;
		const measure = () => {
			avail = el.clientWidth;
			if (probe) chPx = probe.getBoundingClientRect().width / 10 || chPx;
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	});

	const shown = $derived.by(() => {
		if (fit) {
			const budget = Math.max(0, avail - 1);
			return candidates.find((c) => [...c].length * chPx <= budget) ?? candidates[candidates.length - 1];
		}
		if (max === undefined) return text;
		return truncate(text, { max, mode, ...pathOpts });
	});
	const isTruncated = $derived(shown !== text);

	let status = $state('');
	let timer: ReturnType<typeof setTimeout> | undefined;
	async function copy(e: MouseEvent) {
		e.stopPropagation();
		const ok = await copyToClipboard(text);
		oncopy?.(ok);
		status = ok ? copiedLabel : 'Copy failed';
		clearTimeout(timer);
		timer = setTimeout(() => {
			status = '';
		}, 1500);
	}
</script>

{#snippet inner(focusable: boolean)}
	{#if copyable}
		<button type="button" class="trunc copy {klass}" class:mono style={styleProp} data-tsu="Truncate" title={text} onclick={copy}>
			{shown}
		</button>
		<span class="sr-only" role="status" aria-live="polite">{status}</span>
	{:else if focusable}
		<!-- tabindex makes the shortened text reachable by keyboard so the
		     full-text tooltip (wired by Tooltip onto the first focusable child)
		     isn't mouse-only; the span is otherwise non-interactive. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<span class="trunc {klass}" class:mono style={styleProp} data-tsu="Truncate" tabindex="0">{shown}</span>
	{:else}
		<span class="trunc {klass}" class:mono style={styleProp} data-tsu="Truncate">{shown}</span>
	{/if}
{/snippet}

{#snippet body()}
	{#if isTruncated && tooltip}
		<Tooltip {text} {placement}>
			{#snippet trigger()}{@render inner(true)}{/snippet}
		</Tooltip>
	{:else}
		{@render inner(false)}
	{/if}
{/snippet}

{#if fit}
	<span class="rail" class:grow bind:this={rail}>
		{@render body()}
		<span class="probe" bind:this={probe} aria-hidden="true">{'0'.repeat(10)}</span>
	</span>
{:else if grow}
	<span class="rail grow">{@render body()}</span>
{:else}
	{@render body()}
{/if}

<style>
	.trunc {
		/* No layout of its own — it shortens the string, not the box. The cursor
		   hint signals there's more to reveal. */
		cursor: default;
		white-space: nowrap;
	}
	.mono {
		font-family: var(--font-mono);
	}
	.copy {
		border: 0;
		padding: 0;
		background: none;
		color: inherit;
		font: inherit;
		cursor: copy;
	}
	.rail {
		display: inline-flex;
		align-items: center;
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
	}
	.grow {
		flex: 1 1 0;
	}
	.probe {
		position: absolute;
		visibility: hidden;
		white-space: pre;
		pointer-events: none;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}
</style>
