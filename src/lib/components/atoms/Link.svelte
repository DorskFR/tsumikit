<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	// Inline text link — accent text with no button chrome. Renders an <a> when
	// `href` is given, otherwise a <button> (for in-page actions that read as
	// links, e.g. "Open ChatGPT again").
	// Underline: the default `hover` is for navigation, lists and entity titles;
	// use `always` for links inside running prose.
	import type { Snippet } from 'svelte';

	type Own = {
		href?: string;
		target?: string;
		rel?: string;
		download?: string | boolean;
		tone?: 'accent' | 'info' | 'muted' | 'inherit';
		underline?: 'always' | 'hover' | 'none';
		// Text alignment of the <button> form; multi-line titles want `start`.
		align?: 'start' | 'center';
		class?: string;
		children?: Snippet;
	};
	let {
		href,
		tone = 'accent',
		underline = 'hover',
		align = 'start',
		class: klass = '',
		children,
		...rest
	}: Omit<HTMLAttributes<HTMLElement>, keyof Own> & Own = $props();
</script>

{#if href}
	<a
		{href}
		class="link tone-{tone} underline-{underline} align-{align} {klass}"
		data-tsu="Link"
		{...rest}><span class="link-text"><span class="link-ink">{@render children?.()}</span></span></a
	>
{:else}
	<button
		class="link tone-{tone} underline-{underline} align-{align} {klass}"
		data-tsu="Link"
		{...rest}
		type="button"><span class="link-text"><span class="link-ink">{@render children?.()}</span></span></button
	>
{/if}

<style>
	.link {
		background: none;
		border: none;
		padding: 0;
		color: var(--accent, var(--text));
		cursor: pointer;
		text-decoration: underline;
		font: inherit;
		text-align: start;
		transition:
			color var(--dur-fast) ease,
			text-decoration-color var(--dur-fast) ease;
	}
	.tone-info {
		color: var(--info);
	}
	.tone-muted {
		color: var(--text-muted);
	}
	.tone-inherit {
		color: inherit;
	}
	.underline-hover,
	.underline-none {
		text-decoration: none;
	}
	@media (hover: hover) and (pointer: fine) {
		.underline-hover:hover {
			text-decoration: underline;
		}
		.link:hover {
			--link-on: 0%;
			--link-draw: 100%;
			--link-mark: color-mix(in srgb, currentColor 30%, transparent);
			--link-deco: transparent;
			--link-in: var(--dur-press);
			--link-grow: var(--dur-fast);
			--link-hold: var(--dur-instant);
		}
	}
	.align-center {
		text-align: center;
	}

	/* Hover, focus and press only raise these; each variant decides what they paint. */
	.link:is(:focus-visible, :active) {
		--link-on: 0%;
		--link-draw: 100%;
		--link-mark: color-mix(in srgb, currentColor 30%, transparent);
		--link-deco: transparent;
		--link-in: var(--dur-press);
		--link-grow: var(--dur-fast);
		--link-hold: var(--dur-instant);
	}

	/* Sweep line: the underline fills in from the left and leaves to the right. Both variants paint
	   on the inline .link-ink so they follow the text whatever box the app gives .link. */
	.link:not(.underline-none):not(:global([data-fx-link]:not([data-fx-link='sweep'])) *),
	:global([data-fx-link='sweep']) .link:not(.underline-none):not(:global([data-fx-link='sweep'] [data-fx-link]:not([data-fx-link='sweep'])) *) {
		--link-base: 0%;
		text-decoration: none;
		&.underline-always {
			--link-base: 100%;
		}
		.link-ink {
			background-image:
				linear-gradient(currentColor, currentColor),
				linear-gradient(color-mix(in srgb, currentColor 30%, transparent), color-mix(in srgb, currentColor 30%, transparent));
			background-repeat: no-repeat;
			background-position: var(--link-on, 100%) 100%, 0 100%;
			background-size: var(--link-draw, 0%) 1.5px, var(--link-base) 1px;
			transition: background-size var(--dur-fast) var(--ease-out);
		}
	}

	/* Highlighter: a marker swipes in behind the words and fades on leave. */
	:global([data-fx-link='highlight']) .link:not(.underline-none):not(:global([data-fx-link='highlight'] [data-fx-link]:not([data-fx-link='highlight'])) *) {
		margin-inline: -0.18em;
		padding-inline: 0.18em;
		text-decoration-color: var(--link-deco, color-mix(in srgb, currentColor 45%, transparent));
		text-underline-offset: 0.2em;
		transition:
			color var(--dur-fast) ease,
			text-decoration-color var(--dur-fast) ease,
			--link-mark var(--link-in, var(--dur-exit)) ease;
		.link-text,
		.link-ink {
			margin-inline: -0.18em;
			padding-inline: 0.18em;
		}
		.link-ink {
			border-radius: 0.2em 0.35em 0.25em 0.4em;
			background-image: linear-gradient(100deg, var(--link-mark), color-mix(in srgb, var(--link-mark) 70%, transparent));
			background-repeat: no-repeat;
			background-size: var(--link-draw, 0%) 100%;
			transition: background-size var(--link-grow, var(--dur-instant)) var(--ease-out) var(--link-hold, var(--dur-exit));
		}
	}
	@property --link-mark {
		syntax: '<color>';
		inherits: true;
		initial-value: transparent;
	}
	@media (pointer: coarse) {
		.link {
			position: relative;
		}
		.link::before {
			content: '';
			position: absolute;
			inset-block: var(--touch-slab);
			inset-inline-start: var(--touch-slab);
			inset-inline-end: 0;
		}
	}
</style>
