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
		color: var(--accent);
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
	}
	.align-center {
		text-align: center;
	}

	/* Sweep line: the underline fills in from the left and leaves to the right. Both variants paint
	   on the inline .link-ink so they follow the text whatever box the app gives .link. */
	.link:not(.underline-none):not(:global([data-fx-link]:not([data-fx-link='sweep'])) *),
	:global([data-fx-link='sweep']) .link:not(.underline-none):not(:global([data-fx-link='sweep'] [data-fx-link]:not([data-fx-link='sweep'])) *) {
		text-decoration: none;
		.link-ink {
			background-image:
				linear-gradient(currentColor, currentColor),
				linear-gradient(color-mix(in srgb, currentColor 30%, transparent), color-mix(in srgb, currentColor 30%, transparent));
			background-repeat: no-repeat;
			background-position: 100% 100%, 0 100%;
			background-size: 0% 1.5px, 0% 1px;
			transition: background-size var(--dur-fast) var(--ease-out);
		}
		&.underline-always .link-ink {
			background-size: 0% 1.5px, 100% 1px;
		}
		&:is(:focus-visible, :active) .link-ink {
			background-position: 0% 100%, 0 100%;
			background-size: 100% 1.5px, 0% 1px;
		}
		&.underline-always:is(:focus-visible, :active) .link-ink {
			background-size: 100% 1.5px, 100% 1px;
		}
		@media (hover: hover) and (pointer: fine) {
			&:hover .link-ink {
				background-position: 0% 100%, 0 100%;
				background-size: 100% 1.5px, 0% 1px;
			}
			&.underline-always:hover .link-ink {
				background-size: 100% 1.5px, 100% 1px;
			}
		}
	}

	/* Highlighter: a marker swipes in behind the words and fades on leave. */
	:global([data-fx-link='highlight']) .link:not(.underline-none):not(:global([data-fx-link='highlight'] [data-fx-link]:not([data-fx-link='highlight'])) *) {
		margin-inline: -0.18em;
		padding-inline: 0.18em;
		text-decoration-color: color-mix(in srgb, currentColor 45%, transparent);
		text-underline-offset: 0.2em;
		.link-text,
		.link-ink {
			margin-inline: -0.18em;
			padding-inline: 0.18em;
		}
		.link-ink {
			border-radius: 0.2em 0.35em 0.25em 0.4em;
			background-image: linear-gradient(100deg, var(--link-mark), color-mix(in srgb, var(--link-mark) 70%, transparent));
			background-repeat: no-repeat;
			background-size: 0% 100%;
			transition:
				background-size var(--dur-instant) var(--ease-out) var(--dur-exit),
				--link-mark var(--dur-exit) ease;
		}
		&:is(:focus-visible, :active) {
			text-decoration-color: transparent;
		}
		&:is(:focus-visible, :active) .link-ink {
			--link-mark: color-mix(in srgb, currentColor 30%, transparent);
			background-size: 100% 100%;
			transition:
				background-size var(--dur-fast) var(--ease-out) var(--dur-instant),
				--link-mark var(--dur-press) ease;
		}
		@media (hover: hover) and (pointer: fine) {
			&:hover {
				text-decoration-color: transparent;
			}
			&:hover .link-ink {
				--link-mark: color-mix(in srgb, currentColor 30%, transparent);
				background-size: 100% 100%;
				transition:
					background-size var(--dur-fast) var(--ease-out) var(--dur-instant),
					--link-mark var(--dur-press) ease;
			}
		}
	}
	@property --link-mark {
		syntax: '<color>';
		inherits: false;
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
