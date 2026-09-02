<script lang="ts">
	import { browser } from '$lib/env';

	let {
		onclose,
		hideBelow,
		z = 'var(--z-drawer)',
		label = 'Close'
	}: {
		/** Called on click anywhere on the scrim and on Escape (document-level). */
		onclose?: () => void;
		/** Viewport width (CSS length) under which the scrim is not rendered,
		 *  for overlays that go full-bleed on small screens. */
		hideBelow?: string;
		/** z-index; defaults to the drawer layer. */
		z?: string | number;
		/** Accessible name of the click target. */
		label?: string;
	} = $props();

	let hidden = $state(false);

	$effect(() => {
		if (!browser || !hideBelow) {
			hidden = false;
			return;
		}
		const query = matchMedia(`(max-width: ${hideBelow})`);
		const sync = () => {
			hidden = query.matches;
		};
		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	});

	$effect(() => {
		if (!browser) return;
		const onKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented) return;
			event.preventDefault();
			onclose?.();
		};
		document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});
</script>

{#if !hidden}
	<button
		type="button"
		class="scrim"
		style:z-index={z}
		aria-label={label}
		tabindex="-1"
		onclick={() => onclose?.()}
		data-tsu="Scrim"
	></button>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		padding: 0;
		border: 0;
		background: color-mix(in srgb, var(--bg) 45%, transparent);
		cursor: default;
		animation: scrim-fade 0.18s var(--ease);
	}
	@keyframes scrim-fade {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.scrim {
			animation: none;
		}
	}
</style>
