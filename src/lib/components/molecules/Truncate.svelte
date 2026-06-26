<script lang="ts">
	// Character-count truncation with a hover/focus reveal of the full text.
	// Thin wrapper over the `truncate()` helper (the truncation logic lives there
	// and stays unit-testable) plus Tooltip (the reveal). When the text already
	// fits, it renders as a bare inline span with no tooltip wiring at all — so
	// you only pay for the Tooltip when something is actually hidden.
	//
	// For responsive, width-driven end-clipping prefer <Text truncate> (pure
	// CSS); reach for this when you need middle/start truncation or a guaranteed
	// max character count — e.g. addresses, hashes, long ids.
	import { truncate, type TruncateMode } from '$lib/truncate';
	import Tooltip from './Tooltip.svelte';

	let {
		text,
		max,
		mode = 'end',
		ellipsis = '…',
		tooltip = true,
		placement = 'top'
	}: {
		text: string;
		max: number;
		mode?: TruncateMode;
		ellipsis?: string;
		/** Reveal the full text on hover/focus when truncated. Default true. */
		tooltip?: boolean;
		placement?: 'top' | 'bottom' | 'left' | 'right';
	} = $props();

	const shown = $derived(truncate(text, { max, mode, ellipsis }));
	const isTruncated = $derived(shown !== text);
</script>

{#if isTruncated && tooltip}
	<Tooltip text={text} {placement}>
		{#snippet trigger()}
			<!-- tabindex makes the shortened text reachable by keyboard so the
			     full-text tooltip (wired by Tooltip onto the first focusable child)
			     isn't mouse-only; the span is otherwise non-interactive. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<span class="trunc" data-tsu="Truncate" tabindex="0">{shown}</span>
		{/snippet}
	</Tooltip>
{:else}
	<span class="trunc" data-tsu="Truncate">{shown}</span>
{/if}

<style>
	.trunc {
		/* No layout of its own — it shortens the string, not the box. The cursor
		   hint signals there's more to reveal. */
		cursor: default;
	}
</style>
