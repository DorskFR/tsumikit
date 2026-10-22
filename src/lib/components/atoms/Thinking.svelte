<script lang="ts">
	import type { Snippet } from 'svelte';
	// Chat "assistant is working" indicator. `dots`: three dots rise one after
	// the other, drawn in currentColor. `sheen`: a light sweeps through the
	// status word (children, or `label`), with a blinking caret after it.
	let {
		variant = 'dots',
		label = 'Thinking',
		caret = true,
		children,
		class: klass = '',
		style: styleProp = '',
		...rest
	}: {
		variant?: 'dots' | 'sheen';
		/** Announced to AT; also the visible word of `sheen` when there are no children. */
		label?: string;
		/** Blinking caret after the sheen text. */
		caret?: boolean;
		children?: Snippet;
		class?: string;
		style?: string;
		[key: string]: unknown;
	} = $props();
</script>

<span
	data-tsu="Thinking"
	class="thinking v-{variant} {klass}"
	style={styleProp}
	role="status"
	aria-label={variant === 'dots' ? label : undefined}
	{...rest}
>
	{#if variant === 'dots'}
		<span class="dots" aria-hidden="true"><span></span><span></span><span></span></span>
	{:else}
		<span class="text">{#if children}{@render children()}{:else}{label}{/if}</span>
		{#if caret}<span class="caret" aria-hidden="true"></span>{/if}
	{/if}
</span>

<style>
	.thinking {
		display: inline-flex;
		align-items: center;
		line-height: 1;
		vertical-align: middle;
	}
	.dots {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
		padding: 0.25em 0;
	}
	.dots span {
		display: block;
		width: 0.4em;
		height: 0.4em;
		border-radius: 50%;
		background: currentColor;
		animation: tsu-thinking-dot 1.2s var(--ease-in-out) infinite;
	}
	.dots span:nth-child(1) {
		opacity: 1;
	}
	.dots span:nth-child(2) {
		opacity: 0.6;
		animation-delay: 0.15s;
	}
	.dots span:nth-child(3) {
		opacity: 0.3;
		animation-delay: 0.3s;
	}
	@keyframes tsu-thinking-dot {
		0%,
		55%,
		100% {
			opacity: 0.35;
			transform: translateY(0);
		}
		25% {
			opacity: 1;
			transform: translateY(-0.3em);
		}
	}

	.v-sheen {
		line-height: inherit;
	}
	.text {
		background: linear-gradient(90deg, var(--text-muted) 0 38%, var(--text) 50%, var(--text-muted) 62% 100%);
		background-size: 300% 100%;
		background-position: 100% 0;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: tsu-thinking-sheen 1.8s linear infinite;
	}
	@keyframes tsu-thinking-sheen {
		to {
			background-position: 0% 0;
		}
	}
	.caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		margin-left: 0.2em;
		border-radius: 1px;
		background: var(--accent);
		animation: tsu-thinking-blink 1s steps(2, jump-none) infinite;
	}
	@keyframes tsu-thinking-blink {
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dots span,
		.text,
		.caret {
			animation: none;
		}
		.text {
			background-position: 50% 0;
		}
	}
</style>
