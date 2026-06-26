<script lang="ts">
	// A grouped block of sidebar nav items: an optional uppercase mono section
	// `label` (eyebrow) plus consistent tight spacing between the NavItems passed
	// as children. Saves consumers from re-implementing the label + gap inline for
	// every group. At icon-rail width (sidebar container ≤ 8rem) the label hides
	// and the group spacing tightens so the rail stays compact; a thin top divider
	// then stands in for the dropped label to keep the groups visually separated.
	import type { Snippet } from 'svelte';

	let {
		label,
		children,
		...rest
	}: {
		/** Optional section heading; rendered uppercase + mono. Omit for an
		 *  unlabeled group (still gets the group spacing + rail divider). */
		label?: string;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<div class="nav-section" data-tsu="NavSection" {...rest}>
	{#if label}
		<div class="nav-section-label">{label}</div>
	{/if}
	<div class="nav-section-items">
		{@render children?.()}
	</div>
</div>

<style>
	.nav-section {
		display: flex;
		flex-direction: column;
		gap: var(--sp-1);
	}
	/* Groups separate themselves with breathing room; the first one sits flush. */
	.nav-section + :global(.nav-section),
	.nav-section:not(:first-child) {
		margin-top: var(--sp-3);
	}
	.nav-section-label {
		padding: 0 var(--sp-3);
		margin-bottom: var(--sp-1);
		color: var(--text-faint);
		font-family: var(--font-mono);
		font-size: var(--fs-xs);
		font-weight: var(--fw-semibold);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.nav-section-items {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	/* Icon-rail: drop the textual label and use a hairline divider to keep groups
	   distinct when the sidebar collapses to a rail. */
	@container sidebar (max-width: 8rem) {
		.nav-section-label {
			display: none;
		}
		.nav-section:not(:first-child) {
			margin-top: var(--sp-2);
			padding-top: var(--sp-2);
			border-top: 1px solid var(--border);
		}
	}
</style>
